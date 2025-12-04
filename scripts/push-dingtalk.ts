import fs from 'node:fs/promises';
import crypto from 'node:crypto';

interface DingtalkResponse {
  errcode: number;
  errmsg: string;
}

interface PushOptions {
  webhook: string;
  secret?: string;
  title: string;
  reportPath: string;
}

async function readFileSafe(path: string): Promise<string> {
  try {
    return await fs.readFile(path, 'utf-8');
  } catch (error) {
    throw new Error(`读取周报文件失败: ${path}\n${error}`);
  }
}

function buildSignedWebhook(webhook: string, secret?: string): string {
  if (!secret) return webhook;

  const timestamp = Date.now();
  const stringToSign = `${timestamp}\n${secret}`;
  const sign = crypto.createHmac('sha256', secret).update(stringToSign).digest('base64');
  const encodedSign = encodeURIComponent(sign);

  const url = new URL(webhook);
  url.searchParams.set('timestamp', String(timestamp));
  url.searchParams.set('sign', encodedSign);

  return url.toString();
}

async function sendMarkdownMessage(webhook: string, secret: string | undefined, title: string, text: string): Promise<void> {
  const signedWebhook = buildSignedWebhook(webhook, secret);

  const response = await fetch(signedWebhook, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      msgtype: 'markdown',
      markdown: {
        title,
        text,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`发送钉钉消息失败: ${response.status} ${body}`);
  }

  const data = (await response.json()) as DingtalkResponse;
  if (data.errcode !== 0) {
    throw new Error(`发送钉钉消息失败: ${data.errmsg}`);
  }
}

async function pushToDingtalk(options: PushOptions) {
  console.log('正在读取周报内容...');
  const reportContent = await readFileSafe(options.reportPath);

  const title = options.title || '自动周报';
  const text = options.title ? `## ${options.title}\n\n${reportContent}` : reportContent;

  console.log('正在通过钉钉机器人发送周报...');
  await sendMarkdownMessage(options.webhook, options.secret, title, text);
  console.log('✅ 钉钉推送成功');
}

async function main() {
  const webhook = process.env.DINGTALK_WEBHOOK;
  const secret = process.env.DINGTALK_SECRET;

  if (!webhook) {
    throw new Error('缺少 DINGTALK_WEBHOOK 环境变量');
  }

  const reportPath = process.env.REPORT_FILE ?? 'dist/report-weekly.md';
  const title = process.env.REPORT_TITLE ?? '';

  await pushToDingtalk({
    webhook,
    secret,
    title,
    reportPath,
  });
}

main().catch((error) => {
  console.error('❌ 钉钉推送失败:', error);
  process.exitCode = 1;
});

