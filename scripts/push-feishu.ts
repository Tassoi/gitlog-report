import fs from 'node:fs/promises';

interface TenantAccessTokenResponse {
  code: number;
  msg: string;
  tenant_access_token: string;
  expire: number;
}

interface SendMessageResponse {
  code: number;
  msg: string;
  data?: {
    message_id: string;
  };
}

interface PushOptions {
  appId: string;
  appSecret: string;
  userId: string;
  title: string;
  summary: string;
  reportPath: string;
}

async function readFileSafe(path: string): Promise<string> {
  try {
    return await fs.readFile(path, 'utf-8');
  } catch (error) {
    throw new Error(`读取周报文件失败: ${path}\n${error}`);
  }
}

// 获取 tenant_access_token
async function getTenantAccessToken(appId: string, appSecret: string): Promise<string> {
  const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: appId,
      app_secret: appSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`获取 tenant_access_token 失败: ${response.status}`);
  }

  const data = (await response.json()) as TenantAccessTokenResponse;
  if (data.code !== 0) {
    throw new Error(`获取 tenant_access_token 失败: ${data.msg}`);
  }

  return data.tenant_access_token;
}

// 构建富文本消息内容
function buildPostContent(title: string, reportContent: string) {
  const lines = reportContent.split('\n');
  const content: Array<Array<{ tag: string; text?: string; href?: string }>> = lines.map((line) => [
    { tag: 'text', text: line },
  ]);

  return {
    zh_cn: {
      title,
      content,
    },
  };
}

// 发送消息到个人
async function sendMessage(token: string, userId: string, title: string, reportContent: string): Promise<void> {
  const postContent = buildPostContent(title, reportContent);

  const response = await fetch(`https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      receive_id: userId,
      msg_type: 'post',
      content: JSON.stringify({ post: postContent }),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`发送消息失败: ${response.status} ${text}`);
  }

  const data = (await response.json()) as SendMessageResponse;
  if (data.code !== 0) {
    throw new Error(`发送消息失败: ${data.msg}`);
  }
}

async function pushToFeishu(options: PushOptions) {
  // 1. 获取 tenant_access_token
  console.log('正在获取 tenant_access_token...');
  const token = await getTenantAccessToken(options.appId, options.appSecret);

  // 2. 读取周报内容
  const reportContent = await readFileSafe(options.reportPath);
  const content = options.summary || reportContent;

  // 3. 发送消息
  console.log('正在发送消息到飞书...');
  await sendMessage(token, options.userId, options.title, content);

  console.log('✅ 飞书推送成功');
}

async function main() {
  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;
  const userId = process.env.FEISHU_USER_OPEN_ID;

  if (!appId) {
    throw new Error('缺少 FEISHU_APP_ID 环境变量');
  }
  if (!appSecret) {
    throw new Error('缺少 FEISHU_APP_SECRET 环境变量');
  }
  if (!userId) {
    throw new Error('缺少 FEISHU_USER_OPEN_ID 环境变量');
  }

  const reportPath = process.env.REPORT_FILE ?? 'dist/report-weekly.md';
  const title = process.env.REPORT_TITLE ?? '自动化周报';
  const summary = process.env.REPORT_SUMMARY ?? '';

  await pushToFeishu({
    appId,
    appSecret,
    userId,
    title,
    summary,
    reportPath,
  });
}

main().catch((error) => {
  console.error('❌ 飞书推送失败:', error);
  process.exitCode = 1;
});
