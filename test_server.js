import http from 'http';

function fetch(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5184${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function test() {
  console.log('='.repeat(60));
  console.log('蜜蜂记账 App 功能测试');
  console.log('='.repeat(60));
  
  const results = [];
  
  try {
    const home = await fetch('/');
    if (home.status === 200 && home.data.includes('<!DOCTYPE html>')) {
      results.push({ name: '首页加载', status: 'PASS', msg: '首页成功返回HTML' });
      console.log('✅ 测试1: 首页加载 - PASS');
    } else {
      results.push({ name: '首页加载', status: 'FAIL', msg: `状态码: ${home.status}` });
      console.log('❌ 测试1: 首页加载 - FAIL');
    }
  } catch (e) {
    results.push({ name: '首页加载', status: 'FAIL', msg: e.message });
    console.log('❌ 测试1: 首页加载 - FAIL:', e.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('测试结果汇总');
  console.log('='.repeat(60));
  
  const pass = results.filter(r => r.status === 'PASS').length;
  const fail = results.filter(r => r.status === 'FAIL').length;
  
  results.forEach(r => {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${r.name}: ${r.status} - ${r.msg}`);
  });
  
  console.log(`\n总计: ${results.length} 个测试`);
  console.log(`通过: ${pass}, 失败: ${fail}`);
}

test();
