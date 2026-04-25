// 测试 AI 简历分割 API
const http = require('http');
const fs = require('fs');
const path = require('path');

async function testSplitAPI() {
  // 读取简历文件
  const filePath = "C:\\Users\\Administrator\\Desktop\\中文简历25大三版(2).docx";

  try {
    // 使用 mammoth 提取文本
    const mammoth = require('mammoth');
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;

    console.log("=== 提取的简历文本 ===");
    console.log(text.slice(0, 2000));
    console.log("\n... (省略中间部分) ...\n");
    console.log(text.slice(-500));
    console.log("\n=== 文本总长度 ===", text.length, "字符\n");

    // 调用本地 API
    console.log("=== 调用 AI 分割 API ===\n");

    const response = await fetch('http://localhost:3000/api/ai-resume/split', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text })
    });

    const data = await response.json();

    if (data.error) {
      console.error('API 错误:', data.error);
      return;
    }

    console.log(`AI 分割结果：共 ${data.sections.length} 个段落\n`);
    console.log("=== 分割详情 ===\n");

    data.sections.forEach((section, i) => {
      console.log(`--- 段落 ${i + 1} ---`);
      console.log(`标题: ${section.title}`);
      console.log(`类型: ${section.type}`);
      console.log(`内容长度: ${section.content.length} 字符`);
      console.log(`内容预览: ${section.content.slice(0, 200).replace(/\n/g, ' ')}...`);
      console.log("");
    });

  } catch (err) {
    console.error('错误:', err.message);
  }
}

testSplitAPI();
