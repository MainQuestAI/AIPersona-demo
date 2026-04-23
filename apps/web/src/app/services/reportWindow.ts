import { fetchStudyReportHtml } from './studyRuntime';

const LOADING_HTML = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <title>加载研究报告中...</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 32px; color: #111827; }
      p { color: #4b5563; }
    </style>
  </head>
  <body>
    <h1>正在加载研究报告...</h1>
    <p>请稍候，系统正在以当前登录身份获取报告内容。</p>
  </body>
</html>`;

export async function openStudyReportWindow(studyId: string): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('当前环境不支持打开报告窗口。');
  }

  const reportWindow = window.open('', '_blank', 'noopener');
  if (!reportWindow) {
    throw new Error('浏览器拦截了新窗口，请允许弹窗后重试。');
  }

  reportWindow.document.open();
  reportWindow.document.write(LOADING_HTML);
  reportWindow.document.close();

  try {
    const html = await fetchStudyReportHtml(studyId);
    reportWindow.document.open();
    reportWindow.document.write(html);
    reportWindow.document.close();
  } catch (error) {
    reportWindow.close();
    throw error;
  }
}
