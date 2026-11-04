/**
 * 本地 Mock 后端（离线演示 / 无云端连接时使用）
 *
 * 通过 uni 本地存储模拟云端数据库与函数，接口契约与 cloud.js 完全一致。
 * 切换真实云端：services/index.js 根据 ENV.USE_MOCK 选择 cloudBackend。
 *
 * 所有方法统一返回 { code, data, message }（架构设计 8.2）。
 */
import { collection, storage } from './storage';
import { genId, reviewText, reviewImages, generateSummary } from './ai';
import { ERROR_CODE, ERROR_MESSAGE, ok, fail } from '@/constants/errorCode';
import {
  POST_STATUS,
  AI_REVIEW_STATUS,
  CONVERSATION_STATUS,
  MESSAGE_TYPE,
  NOTIFICATION_TYPE,
  REPORT_REASON,
  TARGET_TYPE,
} from '@/constants/enum';

const users = collection('users');
const posts = collection('pet_posts');
const conversations = collection('conversations');
const messages = collection('messages');
const notifications = collection('notifications');
const reports = collection('reports');
const reviewRecords = collection('review_records');
const favorites = collection('favorites');
const appeals = collection('appeals');

/** 当前登录用户（token 即 userId，Mock 简化） */
function currentUser() {
  const uid = storage.get('token', '');
  if (!uid) return null;
  return users.getById(uid);
}

/** 通知：写入并默认未读 */
function pushNotification({ userId, type, content, relatedId = '' }) {
  if (!userId) return;
  notifications.insert({
    _id: genId('ntf'),
    userId,
    type,
    content,
    relatedId,
    read: false,
    createdAt: Date.now(),
  });
}

/** 写入审核记录（可审计，US-08 AC2） */
function writeReviewRecord({ targetType, targetId, aiResult, riskLevel, reason, confidence, handlerId = 'ai', decision = '' }) {
  return reviewRecords.insert({
    _id: genId('rev'),
    targetType,
    targetId,
    aiResult,
    riskLevel,
    reason,
    confidence,
    handlerId,
    decision,
    createdAt: Date.now(),
  });
}

const mockBackend = {
  // ===================== 账号与登录 =====================
  auth: {
    /**
     * 微信三端登录 + 建号（手机号合并逻辑占位）
     * @param {{platform:string, code:string, userInfo?:object}} param0
     */
    async login({ platform = 'MP', code = '', userInfo = {} }) {
      // Mock：code 视为 openid 来源；首次用平台 openid 字段建号，否则复用
      const openidField = platform === 'MP' ? 'openidMP' : platform === 'H5' ? 'openidH5' : 'openidAPP';
      const openid = code || `mock_${platform}_${Date.now()}`;
      let user = users.findOne((u) => u[openidField] === openid);
      if (!user) {
        user = {
          _id: genId('u'),
          [openidField]: openid,
          nickname: userInfo.nickName || '微信用户',
          avatar: userInfo.avatarUrl || '',
          mobile: '',
          role: 'user',
          isMinor: false,
          ageVerified: false,
          status: 'active',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        users.insert(user);
      }
      storage.set('token', user._id);
      storage.set('user', user);
      return ok({ token: user._id, user, needBindMobile: !user.mobile });
    },

    /** 手机号绑定兜底（账号主键打通三端，Q4） */
    async bindMobile({ mobile, smsCode = '000000' }) {
      const user = currentUser();
      if (!user) return fail(ERROR_CODE.UNAUTHORIZED);
      // Mock：验证码固定 000000 通过；真实由短信服务校验
      if (!/^1\d{10}$/.test(mobile)) return fail(ERROR_CODE.INVALID_PARAM, '手机号格式不正确');
      const sameMobile = users.findOne((u) => u.mobile === mobile && u._id !== user._id);
      if (sameMobile) {
        // 合并账号（以手机号为主键）
        user.mobile = mobile;
        user.unionid = sameMobile.unionid || user.unionid;
        users.update(user._id, { mobile, unionid: user.unionid, updatedAt: Date.now() });
        // 简单合并：将另一账号的帖子归属到本账号（演示）
        posts.find((p) => p.authorId === sameMobile._id).forEach((p) => posts.update(p._id, { authorId: user._id }));
        users.remove(sameMobile._id);
      } else {
        users.update(user._id, { mobile, updatedAt: Date.now() });
      }
      const updated = users.getById(user._id);
      storage.set('user', updated);
      return ok({ user: updated });
    },

    async getProfile() {
      const user = currentUser();
      if (!user) return fail(ERROR_CODE.UNAUTHORIZED);
      return ok(user);
    },

    async updateProfile(patch = {}) {
      const user = currentUser();
      if (!user) return fail(ERROR_CODE.UNAUTHORIZED);
      const allowed = ['nickname', 'avatar', 'birthday', 'city', 'bio'];
      const next = {};
      allowed.forEach((k) => {
        if (patch[k] !== undefined) next[k] = patch[k];
      });
      next.updatedAt = Date.now();
      const updated = users.update(user._id, next);
      storage.set('user', updated);
      return ok(updated);
    },
  },

  // ===================== 领养帖 =====================
  post: {
    /**
     * 发布待领养帖（触发 AI 实时审核，D1）
     */
    async create(payload = {}) {
      const user = currentUser();
      if (!user) return fail(ERROR_CODE.UNAUTHORIZED);
      if (!user.mobile) return fail(ERROR_CODE.FORBIDDEN, '请先绑定手机号后再发布');
      // 必填校验
      const required = ['species', 'breed', 'age', 'gender', 'healthStatus', 'location', 'reason'];
      for (const k of required) {
        if (payload[k] === undefined || payload[k] === null || payload[k] === '') {
          return fail(ERROR_CODE.INVALID_PARAM, `缺少必填项：${k}`);
        }
      }
      if (!Array.isArray(payload.photos) || payload.photos.length === 0) {
        return fail(ERROR_CODE.INVALID_PARAM, '请至少上传 1 张宠物照片');
      }

      const post = {
        _id: genId('post'),
        authorId: user._id,
        species: payload.species,
        breed: payload.breed,
        age: Number(payload.age),
        gender: payload.gender,
        healthStatus: payload.healthStatus,
        location: payload.location,
        personality: payload.personality || '',
        reason: payload.reason,
        photos: payload.photos,
        status: POST_STATUS.PENDING,
        aiReviewStatus: AI_REVIEW_STATUS.PENDING,
        aiTags: [],
        summary: '',
        viewCount: 0,
        favoriteCount: 0,
        createdAt: Date.now(),
      };
      posts.insert(post);

      // 触发 AI 文本审核（D1）
      const text = `${post.breed} ${post.personality} ${post.reason}`;
      const review = await reviewText({ targetType: TARGET_TYPE.POST, targetId: post._id, text });
      const r = review.data;
      writeReviewRecord({ targetType: TARGET_TYPE.POST, targetId: post._id, ...r });

      if (r.aiResult === 'block') {
        const updated = posts.update(post._id, {
          aiReviewStatus: AI_REVIEW_STATUS.BLOCKED,
          status: POST_STATUS.TAKEN_DOWN,
        });
        pushNotification({
          userId: user._id,
          type: NOTIFICATION_TYPE.SYSTEM,
          content: `您的帖子因「${r.reason}」未通过审核已被拦截，可修改后重新发布或申诉。`,
          relatedId: post._id,
        });
        return ok({ postId: post._id, aiReviewStatus: AI_REVIEW_STATUS.BLOCKED, post: updated });
      }
      if (r.aiResult === 'review') {
        const updated = posts.update(post._id, { aiReviewStatus: AI_REVIEW_STATUS.REVIEW });
        return ok({ postId: post._id, aiReviewStatus: AI_REVIEW_STATUS.REVIEW, post: updated });
      }
      // 通过：生成摘要/标签（D3），帖子转为待领养
      const sum = await generateSummary(text);
      const updated = posts.update(post._id, {
        aiReviewStatus: AI_REVIEW_STATUS.PASS,
        status: POST_STATUS.ADOPTABLE,
        summary: sum.data.summary,
        aiTags: sum.data.tags,
      });
      return ok({ postId: post._id, aiReviewStatus: AI_REVIEW_STATUS.PASS, post: updated });
    },

    /**
     * 列表（游客可见：仅 status=adoptable 且 aiReviewStatus=pass）
     * @param {{filter?:object, keyword?:string, page?:number}} param0
     */
    async list({ filter = {}, keyword = '', page = 1 } = {}) {
      let list = posts.all().filter(
        (p) => p.status === POST_STATUS.ADOPTABLE && p.aiReviewStatus === AI_REVIEW_STATUS.PASS
      );
      // 筛选
      if (filter.species) list = list.filter((p) => p.species === filter.species);
      if (filter.gender) list = list.filter((p) => p.gender === filter.gender);
      if (filter.healthStatus) list = list.filter((p) => (p.healthStatus || []).includes(filter.healthStatus));
      if (filter.city) list = list.filter((p) => (p.location || {}).city === filter.city);
      if (filter.ageMax != null) list = list.filter((p) => Number(p.age) <= Number(filter.ageMax));
      if (filter.ageMin != null) list = list.filter((p) => Number(p.age) >= Number(filter.ageMin));
      // 关键词（品种/城市/性格/摘要）
      if (keyword) {
        const kw = keyword.toLowerCase();
        list = list.filter((p) =>
          [p.breed, p.summary, p.personality, (p.location || {}).city]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(kw)
        );
      }
      list.sort((a, b) => b.createdAt - a.createdAt);
      const pageSize = 10;
      const total = list.length;
      const paged = list.slice((page - 1) * pageSize, page * pageSize);
      return ok({ list: paged, total, page, pageSize });
    },

    /** 详情（联系方式不返回，隐私合规） */
    async detail(postId) {
      const post = posts.getById(postId);
      if (!post) return fail(ERROR_CODE.NOT_FOUND);
      posts.update(postId, { viewCount: (post.viewCount || 0) + 1 });
      const author = users.getById(post.authorId);
      const { ...safePost } = post;
      delete safePost.contactEnc;
      return ok({ ...safePost, author: author ? { _id: author._id, nickname: author.nickname, avatar: author.avatar } : null });
    },

    /** 帖子状态管理（撤下/重新上架/预定/领养，A6） */
    async changeStatus(postId, status) {
      const user = currentUser();
      const post = posts.getById(postId);
      if (!post) return fail(ERROR_CODE.NOT_FOUND);
      if (user && post.authorId !== user._id) return fail(ERROR_CODE.FORBIDDEN, '仅发帖人可管理状态');
      const allowed = [POST_STATUS.ADOPTABLE, POST_STATUS.RESERVED, POST_STATUS.ADOPTED, POST_STATUS.TAKEN_DOWN];
      if (!allowed.includes(status)) return fail(ERROR_CODE.INVALID_PARAM, '非法状态');
      // 已领养仅可标记一次
      if (status === POST_STATUS.ADOPTED && post.status === POST_STATUS.ADOPTED) {
        return fail(ERROR_CODE.INVALID_PARAM, '该帖子已标记为领养，不可重复标记');
      }
      const updated = posts.update(postId, { status, updatedAt: Date.now() });
      return ok(updated);
    },

    /** 收藏/取消（A7） */
    async toggleFavorite(postId) {
      const user = currentUser();
      if (!user) return fail(ERROR_CODE.UNAUTHORIZED);
      const exist = favorites.findOne((f) => f.userId === user._id && f.targetId === postId);
      let favorited;
      if (exist) {
        favorites.remove(exist._id);
        favorited = false;
      } else {
        favorites.insert({ _id: genId('fav'), userId: user._id, targetType: 'post', targetId: postId, createdAt: Date.now() });
        favorited = true;
      }
      const post = posts.getById(postId);
      if (post) posts.update(postId, { favoriteCount: Math.max(0, (post.favoriteCount || 0) + (favorited ? 1 : -1)) });
      return ok({ favorited });
    },

    /** 我的发布 */
    async myPosts() {
      const user = currentUser();
      if (!user) return fail(ERROR_CODE.UNAUTHORIZED);
      const list = posts.all().filter((p) => p.authorId === user._id).sort((a, b) => b.createdAt - a.createdAt);
      return ok(list);
    },

    /** 我的收藏 */
    async myFavorites() {
      const user = currentUser();
      if (!user) return fail(ERROR_CODE.UNAUTHORIZED);
      const ids = favorites.find((f) => f.userId === user._id).map((f) => f.targetId);
      const list = posts.all().filter((p) => ids.includes(p._id));
      return ok(list);
    },
  },

  // ===================== 会话 / 消息 =====================
  conversation: {
    /** 发起领养意向，创建会话（A4） */
    async create({ postId }) {
      const user = currentUser();
      if (!user) return fail(ERROR_CODE.UNAUTHORIZED);
      const post = posts.getById(postId);
      if (!post) return fail(ERROR_CODE.NOT_FOUND);
      if (post.authorId === user._id) return fail(ERROR_CODE.FORBIDDEN, '不能对自己发布的帖子发起领养');
      // 已存在则复用
      const exist = conversations.findOne(
        (c) => c.postId === postId && c.adopterId === user._id && c.publisherId === post.authorId
      );
      if (exist) return ok({ conversationId: exist._id, existed: true });

      const conv = conversations.insert({
        _id: genId('conv'),
        postId,
        adopterId: user._id,
        publisherId: post.authorId,
        status: CONVERSATION_STATUS.ACTIVE,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      // 自动追加「领养意向卡」消息
      messages.insert({
        _id: genId('msg'),
        conversationId: conv._id,
        senderId: user._id,
        type: MESSAGE_TYPE.INTENT,
        content: '我对该宠物有领养意向，希望能进一步了解～',
        contactEnc: '',
        isContactShared: false,
        aiFlag: '',
        createdAt: Date.now(),
      });
      // 通知发帖人
      pushNotification({
        userId: post.authorId,
        type: NOTIFICATION_TYPE.INTENT,
        content: `有人对您的帖子「${post.breed}」发起领养意向`,
        relatedId: conv._id,
      });
      return ok({ conversationId: conv._id, existed: false });
    },

    /** 会话列表（当前用户相关的） */
    async list() {
      const user = currentUser();
      if (!user) return fail(ERROR_CODE.UNAUTHORIZED);
      const list = conversations
        .all()
        .filter((c) => c.adopterId === user._id || c.publisherId === user._id)
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .map((c) => {
          const post = posts.getById(c.postId);
          const peerId = c.adopterId === user._id ? c.publisherId : c.adopterId;
          const peer = users.getById(peerId);
          const last = messages.all().filter((m) => m.conversationId === c._id).sort((a, b) => b.createdAt - a.createdAt)[0];
          return { ...c, post: post ? { _id: post._id, breed: post.breed, photos: post.photos } : null, peer: peer ? { _id: peer._id, nickname: peer.nickname, avatar: peer.avatar } : null, lastMessage: last || null };
        });
      return ok(list);
    },

    async detail(conversationId) {
      const user = currentUser();
      const conv = conversations.getById(conversationId);
      if (!conv) return fail(ERROR_CODE.NOT_FOUND);
      if (user && conv.adopterId !== user._id && conv.publisherId !== user._id) {
        return fail(ERROR_CODE.FORBIDDEN);
      }
      const post = posts.getById(conv.postId);
      return ok({ ...conv, post, isPublisher: user && conv.publisherId === user._id });
    },

    /** 消息列表（仅会话双方可见，含联系方式解密由前端按需触发） */
    async messages(conversationId) {
      const user = currentUser();
      const conv = conversations.getById(conversationId);
      if (!conv) return fail(ERROR_CODE.NOT_FOUND);
      if (user && conv.adopterId !== user._id && conv.publisherId !== user._id) {
        return fail(ERROR_CODE.FORBIDDEN);
      }
      const list = messages.all().filter((m) => m.conversationId === conversationId).sort((a, b) => a.createdAt - b.createdAt);
      return ok(list);
    },

    /**
     * 发送消息（文字/图片/联系方式卡）
     * 联系方式经加密字段 contactEnc 存储，仅双方可见（隐私合规 7.5）
     */
    async sendMessage({ conversationId, type, content = '', contactEnc = '', contactType = '' }) {
      const user = currentUser();
      const conv = conversations.getById(conversationId);
      if (!conv) return fail(ERROR_CODE.NOT_FOUND);
      if (conv.adopterId !== user._id && conv.publisherId !== user._id) return fail(ERROR_CODE.FORBIDDEN);

      const msg = messages.insert({
        _id: genId('msg'),
        conversationId,
        senderId: user._id,
        type,
        content,
        contactEnc,
        isContactShared: type === MESSAGE_TYPE.CONTACT,
        aiFlag: '',
        createdAt: Date.now(),
      });
      conversations.update(conversationId, { updatedAt: Date.now() });
      // 通知对方
      const peerId = conv.adopterId === user._id ? conv.publisherId : conv.adopterId;
      pushNotification({
        userId: peerId,
        type: NOTIFICATION_TYPE.SYSTEM,
        content: type === MESSAGE_TYPE.CONTACT ? '对方已发送联系方式' : '您收到一条新消息',
        relatedId: conversationId,
      });
      return ok({ messageId: msg._id, message: msg });
    },

    /** 发帖人接受 / 拒绝（A5，US-04） */
    async decide({ conversationId, action }) {
      const user = currentUser();
      const conv = conversations.getById(conversationId);
      if (!conv) return fail(ERROR_CODE.NOT_FOUND);
      if (conv.publisherId !== user._id) return fail(ERROR_CODE.FORBIDDEN, '仅发帖人可决定接受/拒绝');
      if (!['accept', 'reject'].includes(action)) return fail(ERROR_CODE.INVALID_PARAM);

      if (action === 'accept') {
        conversations.update(conversationId, { status: CONVERSATION_STATUS.ACCEPTED, updatedAt: Date.now() });
        // 已领养状态仅可标记一次
        const post = posts.getById(conv.postId);
        if (post && post.status !== POST_STATUS.ADOPTED) {
          posts.update(conv.postId, { status: POST_STATUS.ADOPTED });
        }
        messages.insert({
          _id: genId('msg'),
          conversationId,
          senderId: user._id,
          type: MESSAGE_TYPE.SYSTEM,
          content: '发帖人已接受您的领养意向 🎉',
          contactEnc: '',
          isContactShared: false,
          aiFlag: '',
          createdAt: Date.now(),
        });
        pushNotification({
          userId: conv.adopterId,
          type: NOTIFICATION_TYPE.ACCEPT,
          content: '您的领养意向已被接受！',
          relatedId: conversationId,
        });
      } else {
        conversations.update(conversationId, { status: CONVERSATION_STATUS.REJECTED, updatedAt: Date.now() });
        messages.insert({
          _id: genId('msg'),
          conversationId,
          senderId: user._id,
          type: MESSAGE_TYPE.SYSTEM,
          content: '发帖人暂未接受本次领养意向，感谢理解。',
          contactEnc: '',
          isContactShared: false,
          aiFlag: '',
          createdAt: Date.now(),
        });
        pushNotification({
          userId: conv.adopterId,
          type: NOTIFICATION_TYPE.REJECT,
          content: '您的领养意向未被接受',
          relatedId: conversationId,
        });
      }
      return ok({ status: action === 'accept' ? CONVERSATION_STATUS.ACCEPTED : CONVERSATION_STATUS.REJECTED });
    },
  },

  // ===================== 消息中心 =====================
  notification: {
    async list() {
      const user = currentUser();
      if (!user) return fail(ERROR_CODE.UNAUTHORIZED);
      const list = notifications.all().filter((n) => n.userId === user._id).sort((a, b) => b.createdAt - a.createdAt);
      return ok(list);
    },
    async unreadCount() {
      const user = currentUser();
      if (!user) return ok({ count: 0 });
      const count = notifications.all().filter((n) => n.userId === user._id && !n.read).length;
      return ok({ count });
    },
    async markRead(id) {
      const user = currentUser();
      if (!user) return fail(ERROR_CODE.UNAUTHORIZED);
      if (id) {
        const n = notifications.getById(id);
        if (n && n.userId === user._id) notifications.update(id, { read: true });
      } else {
        notifications.all().filter((n) => n.userId === user._id).forEach((n) => notifications.update(n._id, { read: true }));
      }
      return ok({});
    },
  },

  // ===================== 举报 / 复核 =====================
  report: {
    /**
     * 创建举报（A8/E6），进入 AI + 人工复核队列占位
     */
    async create({ targetType, targetId, reason, detail = '' }) {
      const user = currentUser();
      if (!user) return fail(ERROR_CODE.UNAUTHORIZED);
      if (!Object.values(REPORT_REASON).includes(reason)) return fail(ERROR_CODE.INVALID_PARAM, '请选择举报原因');
      const report = reports.insert({
        _id: genId('rep'),
        reporterId: user._id,
        targetType,
        targetId,
        reason,
        detail,
        status: 'pending',
        aiResult: '',
        handlerId: '',
        createdAt: Date.now(),
      });
      // AI 复核目标内容（示例：帖子）
      let text = '';
      if (targetType === TARGET_TYPE.POST) {
        const p = posts.getById(targetId);
        if (p) text = `${p.breed} ${p.personality} ${p.reason}`;
      }
      const review = await reviewText({ targetType: 'report', targetId: report._id, text });
      const r = review.data;
      reports.update(report._id, { aiResult: r.aiResult });
      writeReviewRecord({ targetType: 'report', targetId: report._id, ...r });
      // 多次举报自动降权（US-07 AC3）
      const sameCount = reports.all().filter((x) => x.targetType === targetType && x.targetId === targetId).length;
      if ((r.aiResult === 'block' && r.riskLevel === 'high') || sameCount >= 3) {
        if (targetType === TARGET_TYPE.POST) posts.update(targetId, { status: POST_STATUS.TAKEN_DOWN });
      }
      // 通知举报人（已受理，待复核）
      pushNotification({
        userId: user._id,
        type: NOTIFICATION_TYPE.REPORT,
        content: '您的举报已提交，平台将尽快复核（AI + 人工）',
        relatedId: report._id,
      });
      return ok({ reportId: report._id, aiResult: r.aiResult });
    },

    /** 复核队列（运营端，SLA 24h；Mock 返回全部 pending） */
    async list() {
      const list = reports.all().filter((r) => r.status === 'pending');
      return ok(list);
    },

    /** 人工复核决策（human-review 占位） */
    async decide({ reportId, decision }) {
      const report = reports.getById(reportId);
      if (!report) return fail(ERROR_CODE.NOT_FOUND);
      reports.update(reportId, { status: 'handled', handlerId: 'operator', aiResult: decision });
      writeReviewRecord({ targetType: 'report', targetId: reportId, aiResult: decision, riskLevel: 'medium', reason: '人工复核', handlerId: 'operator', decision });
      // 通知举报人结果
      pushNotification({
        userId: report.reporterId,
        type: NOTIFICATION_TYPE.REPORT,
        content: decision === 'block' ? '您举报的内容经复核已被处理' : '您举报的内容经复核未发现违规',
        relatedId: reportId,
      });
      return ok({ ok: true });
    },
  },

  // ===================== 审核记录查询 =====================
  review: {
    async records(targetType, targetId) {
      const list = reviewRecords.all().filter((r) => r.targetType === targetType && r.targetId === targetId);
      return ok(list);
    },
  },

  // ===================== 图片审核（占位） =====================
  imageReview: async (images = []) => reviewImages(images),
};

/** 首次运行注入演示数据（种子帖子 + 演示发帖人），便于离线浏览 */
export function seedMockData() {
  if (storage.get('mock_seeded', false)) return;
  const author = users.insert({
    _id: 'u_seed_author',
    openidMP: 'seed_openid',
    nickname: '爱心救助站',
    avatar: '',
    mobile: '13800000000',
    role: 'user',
    isMinor: false,
    ageVerified: true,
    status: 'active',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now(),
  });
  const samples = [
    {
      species: 'cat',
      breed: '英国短毛猫',
      age: 8,
      gender: 'female',
      healthStatus: ['vaccinated', 'neutered'],
      location: { city: '深圳', district: '南山区' },
      personality: '温顺亲人，喜欢晒太阳',
      reason: '因工作调动无法继续照料，希望找到负责任的领养家庭。',
      photos: ['https://placekitten.com/400/400'],
    },
    {
      species: 'dog',
      breed: '中华田园犬',
      age: 14,
      gender: 'male',
      healthStatus: ['healthy', 'dewormed'],
      location: { city: '广州', district: '天河区' },
      personality: '聪明忠诚，已学会基本指令',
      reason: '流浪救助犬，已完成疫苗，等待温暖的家。',
      photos: ['https://placedog.net/400/400'],
    },
    {
      species: 'cat',
      breed: '橘猫',
      age: 5,
      gender: 'male',
      healthStatus: ['vaccinated'],
      location: { city: '深圳', district: '福田区' },
      personality: '活泼贪吃，适应力强',
      reason: '原主人出国，希望给它找个长期陪伴的家庭。',
      photos: ['https://placekitten.com/401/401'],
    },
  ];
  samples.forEach((s, i) => {
    posts.insert({
      _id: `post_seed_${i}`,
      authorId: author._id,
      ...s,
      status: POST_STATUS.ADOPTABLE,
      aiReviewStatus: AI_REVIEW_STATUS.PASS,
      aiTags: [s.species === 'cat' ? '猫' : '狗'],
      summary: `${s.breed}·${s.personality}`,
      viewCount: 0,
      favoriteCount: 0,
      createdAt: Date.now() - 86400000 * (i + 1),
    });
  });
  storage.set('mock_seeded', true);
}

export default mockBackend;
