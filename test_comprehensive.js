import http from 'http';
import fs from 'fs';

const PORT = 5185;

function fetch(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${PORT}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    }).on('error', reject);
  });
}

async function test() {
  const results = [];
  const screenshots = [];
  
  console.log('='.repeat(60));
  console.log('蜜蜂记账 App 功能测试报告');
  console.log('='.repeat(60));
  console.log(`测试时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log(`服务器地址: http://localhost:${PORT}/`);
  console.log('='.repeat(60));
  
  console.log('\n【1. 服务器响应测试】');
  try {
    const home = await fetch('/');
    if (home.status === 200) {
      results.push({ name: '服务器响应', status: 'PASS', msg: `状态码: ${home.status}` });
      console.log('  ✅ 服务器响应正常 (状态码: 200)');
      
      if (home.data.includes('<!DOCTYPE html>') || home.data.includes('<html')) {
        results.push({ name: 'HTML结构', status: 'PASS', msg: '返回有效的HTML文档' });
        console.log('  ✅ HTML结构有效');
      } else {
        results.push({ name: 'HTML结构', status: 'WARN', msg: 'HTML结构可能不完整' });
        console.log('  ⚠️ HTML结构可能不完整');
      }
      
      if (home.data.includes('react') || home.data.includes('React') || home.data.includes('root')) {
        results.push({ name: 'React挂载点', status: 'PASS', msg: '找到React挂载点' });
        console.log('  ✅ React挂载点存在');
      } else {
        results.push({ name: 'React挂载点', status: 'WARN', msg: '未找到React挂载点' });
        console.log('  ⚠️ 未找到React挂载点');
      }
      
      if (home.data.includes('蜜蜂记账') || home.data.includes('Bee')) {
        results.push({ name: '应用标题', status: 'PASS', msg: '找到应用标题' });
        console.log('  ✅ 应用标题正确');
      } else {
        results.push({ name: '应用标题', status: 'WARN', msg: '未找到应用标题' });
        console.log('  ⚠️ 未找到应用标题');
      }
    } else {
      results.push({ name: '服务器响应', status: 'FAIL', msg: `状态码: ${home.status}` });
      console.log(`  ❌ 服务器响应异常 (状态码: ${home.status})`);
    }
  } catch (e) {
    results.push({ name: '服务器响应', status: 'FAIL', msg: e.message });
    console.log(`  ❌ 服务器连接失败: ${e.message}`);
  }
  
  console.log('\n【2. 静态资源测试】');
  try {
    const mainJs = await fetch('/src/main.tsx');
    if (mainJs.status === 200 || mainJs.status === 304) {
      results.push({ name: '主入口文件', status: 'PASS', msg: 'main.tsx 可访问' });
      console.log('  ✅ 主入口文件可访问');
    } else {
      results.push({ name: '主入口文件', status: 'WARN', msg: `状态码: ${mainJs.status}` });
      console.log(`  ⚠️ 主入口文件状态: ${mainJs.status}`);
    }
  } catch (e) {
    results.push({ name: '主入口文件', status: 'WARN', msg: e.message });
    console.log(`  ⚠️ 主入口文件检查跳过: ${e.message}`);
  }
  
  console.log('\n【3. 页面路由测试】');
  const routes = ['/', '/stats', '/budget', '/add', '/profile', '/ai'];
  for (const route of routes) {
    try {
      const res = await fetch(route);
      if (res.status === 200) {
        results.push({ name: `路由 ${route}`, status: 'PASS', msg: '可访问' });
        console.log(`  ✅ 路由 ${route} 可访问`);
      } else {
        results.push({ name: `路由 ${route}`, status: 'WARN', msg: `状态码: ${res.status}` });
        console.log(`  ⚠️ 路由 ${route} 状态: ${res.status}`);
      }
    } catch (e) {
      results.push({ name: `路由 ${route}`, status: 'FAIL', msg: e.message });
      console.log(`  ❌ 路由 ${route} 错误: ${e.message}`);
    }
  }
  
  console.log('\n【4. 功能模块检查】');
  const srcFiles = [
    '/src/pages/Home/index.tsx',
    '/src/pages/Stats/index.tsx',
    '/src/pages/Budget/index.tsx',
    '/src/pages/AddRecord/index.tsx',
    '/src/pages/Profile/index.tsx',
    '/src/pages/AIAssistant/index.tsx',
    '/src/store/transactionStore.ts',
    '/src/store/budgetStore.ts',
    '/src/store/settingsStore.ts',
  ];
  
  let accessibleCount = 0;
  for (const file of srcFiles) {
    try {
      const res = await fetch(file);
      if (res.status === 200 || res.status === 304) {
        accessibleCount++;
      }
    } catch (e) {
      // ignore
    }
  }
  
  if (accessibleCount >= srcFiles.length * 0.8) {
    results.push({ name: '功能模块', status: 'PASS', msg: `${accessibleCount}/${srcFiles.length} 模块可访问` });
    console.log(`  ✅ 功能模块检查通过 (${accessibleCount}/${srcFiles.length})`);
  } else {
    results.push({ name: '功能模块', status: 'WARN', msg: `仅 ${accessibleCount}/${srcFiles.length} 模块可访问` });
    console.log(`  ⚠️ 部分功能模块不可访问 (${accessibleCount}/${srcFiles.length})`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('测试结果汇总');
  console.log('='.repeat(60));
  
  const pass = results.filter(r => r.status === 'PASS').length;
  const warn = results.filter(r => r.status === 'WARN').length;
  const fail = results.filter(r => r.status === 'FAIL').length;
  
  console.log('\n详细结果:');
  results.forEach(r => {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'WARN' ? '⚠️' : '❌';
    console.log(`  ${icon} ${r.name}: ${r.msg}`);
  });
  
  console.log('\n统计:');
  console.log(`  总计: ${results.length} 个测试`);
  console.log(`  ✅ 通过: ${pass}`);
  console.log(`  ⚠️ 警告: ${warn}`);
  console.log(`  ❌ 失败: ${fail}`);
  console.log(`  通过率: ${((pass / results.length) * 100).toFixed(1)}%`);
  
  const reportContent = `# 蜜蜂记账 App 功能测试报告

## 测试信息
- 测试时间: ${new Date().toLocaleString('zh-CN')}
- 服务器地址: http://localhost:${PORT}/
- 测试框架: Node.js HTTP

## 测试结果汇总

| 指标 | 数量 |
|------|------|
| 总测试数 | ${results.length} |
| 通过 | ${pass} |
| 警告 | ${warn} |
| 失败 | ${fail} |
| 通过率 | ${((pass / results.length) * 100).toFixed(1)}% |

## 详细测试结果

| 测试项 | 状态 | 说明 |
|--------|------|------|
${results.map(r => `| ${r.name} | ${r.status} | ${r.msg} |`).join('\n')}

## 功能覆盖

### 已测试功能
1. ✅ 服务器响应
2. ✅ HTML结构验证
3. ✅ React挂载点
4. ✅ 应用标题
5. ✅ 静态资源访问
6. ✅ 页面路由
7. ✅ 功能模块

### 待测试功能 (需要浏览器环境)
1. ⏳ 记账功能 (添加/编辑/删除交易)
2. ⏳ 预算设置
3. ⏳ 统计图表
4. ⏳ 数据导入/导出
5. ⏳ AI助手
6. ⏳ 主题切换
7. ⏳ 提醒功能

## 建议
${fail > 0 ? '- 存在失败的测试项，建议检查服务器配置\n' : ''}
${warn > 0 ? '- 存在警告项，建议进一步验证\n' : ''}
- 建议使用浏览器自动化工具进行完整的功能测试
`;
  
  fs.writeFileSync('dogfood-output/test-report.md', reportContent);
  console.log('\n📄 测试报告已保存到: dogfood-output/test-report.md');
}

test();
