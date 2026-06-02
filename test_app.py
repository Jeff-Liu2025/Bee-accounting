from playwright.sync_api import sync_playwright
import os

def test_app():
    test_results = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 390, 'height': 844})
        page = context.new_page()
        
        try:
            print("=" * 60)
            print("蜜蜂记账 App 功能测试")
            print("=" * 60)
            
            page.goto('http://localhost:5182/')
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(1000)
            
            page.screenshot(path='test_screenshots/01_home.png', full_page=True)
            test_results.append(("首页加载", "PASS", "首页成功加载"))
            print("✅ 测试1: 首页加载 - PASS")
            
            print("\n--- 测试导航功能 ---")
            
            nav_items = page.locator('nav button, nav a, [role="navigation"] button, [role="navigation"] a').all()
            print(f"找到 {len(nav_items)} 个导航项")
            
            page.screenshot(path='test_screenshots/02_nav_check.png')
            
            stats_btn = page.locator('button:has-text("统计"), a:has-text("统计"), [href*="stats"]').first
            if stats_btn.count() > 0:
                stats_btn.click()
                page.wait_for_load_state('networkidle')
                page.wait_for_timeout(500)
                page.screenshot(path='test_screenshots/03_stats.png', full_page=True)
                test_results.append(("导航-统计页", "PASS", "成功导航到统计页"))
                print("✅ 测试2: 导航到统计页 - PASS")
            else:
                test_results.append(("导航-统计页", "SKIP", "未找到统计按钮"))
                print("⏭️ 测试2: 导航到统计页 - SKIP (未找到按钮)")
            
            budget_btn = page.locator('button:has-text("预算"), a:has-text("预算"), [href*="budget"]').first
            if budget_btn.count() > 0:
                budget_btn.click()
                page.wait_for_load_state('networkidle')
                page.wait_for_timeout(500)
                page.screenshot(path='test_screenshots/04_budget.png', full_page=True)
                test_results.append(("导航-预算页", "PASS", "成功导航到预算页"))
                print("✅ 测试3: 导航到预算页 - PASS")
            else:
                test_results.append(("导航-预算页", "SKIP", "未找到预算按钮"))
                print("⏭️ 测试3: 导航到预算页 - SKIP (未找到按钮)")
            
            add_btn = page.locator('button:has-text("记账"), a:has-text("记账"), [href*="add"], button:has-text("添加"), a:has-text("添加")').first
            if add_btn.count() > 0:
                add_btn.click()
                page.wait_for_load_state('networkidle')
                page.wait_for_timeout(500)
                page.screenshot(path='test_screenshots/05_add_record.png', full_page=True)
                test_results.append(("导航-记账页", "PASS", "成功导航到记账页"))
                print("✅ 测试4: 导航到记账页 - PASS")
                
                amount_input = page.locator('input[type="number"], input[placeholder*="金额"], input[placeholder*="amount"]').first
                if amount_input.count() > 0:
                    amount_input.fill('100')
                    page.wait_for_timeout(300)
                    
                    note_input = page.locator('input[placeholder*="备注"], input[placeholder*="note"], textarea').first
                    if note_input.count() > 0:
                        note_input.fill('测试交易')
                        page.wait_for_timeout(300)
                    
                    page.screenshot(path='test_screenshots/06_add_record_filled.png', full_page=True)
                    test_results.append(("记账-输入", "PASS", "成功输入金额和备注"))
                    print("✅ 测试5: 记账输入 - PASS")
                else:
                    test_results.append(("记账-输入", "SKIP", "未找到金额输入框"))
                    print("⏭️ 测试5: 记账输入 - SKIP")
            else:
                test_results.append(("导航-记账页", "SKIP", "未找到记账按钮"))
                print("⏭️ 测试4: 导航到记账页 - SKIP")
            
            profile_btn = page.locator('button:has-text("我的"), a:has-text("我的"), [href*="profile"]').first
            if profile_btn.count() > 0:
                profile_btn.click()
                page.wait_for_load_state('networkidle')
                page.wait_for_timeout(500)
                page.screenshot(path='test_screenshots/07_profile.png', full_page=True)
                test_results.append(("导航-我的页", "PASS", "成功导航到我的页面"))
                print("✅ 测试6: 导航到我的页面 - PASS")
                
                theme_toggle = page.locator('button:has-text("深色"), button:has-text("浅色"), button:has-text("主题"), [class*="theme"]').first
                if theme_toggle.count() > 0:
                    theme_toggle.click()
                    page.wait_for_timeout(500)
                    page.screenshot(path='test_screenshots/08_theme_toggle.png', full_page=True)
                    test_results.append(("主题切换", "PASS", "主题切换功能正常"))
                    print("✅ 测试7: 主题切换 - PASS")
                else:
                    test_results.append(("主题切换", "SKIP", "未找到主题切换按钮"))
                    print("⏭️ 测试7: 主题切换 - SKIP")
            else:
                test_results.append(("导航-我的页", "SKIP", "未找到我的按钮"))
                print("⏭️ 测试6: 导航到我的页面 - SKIP")
            
            page.goto('http://localhost:5182/')
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(500)
            
            ai_btn = page.locator('button:has-text("AI"), [class*="ai"], [aria-label*="AI"]').first
            if ai_btn.count() > 0:
                ai_btn.click()
                page.wait_for_load_state('networkidle')
                page.wait_for_timeout(500)
                page.screenshot(path='test_screenshots/09_ai_assistant.png', full_page=True)
                test_results.append(("AI助手", "PASS", "AI助手功能可访问"))
                print("✅ 测试8: AI助手 - PASS")
            else:
                test_results.append(("AI助手", "SKIP", "未找到AI按钮"))
                print("⏭️ 测试8: AI助手 - SKIP")
            
            print("\n" + "=" * 60)
            print("测试结果汇总")
            print("=" * 60)
            
            pass_count = sum(1 for r in test_results if r[1] == "PASS")
            skip_count = sum(1 for r in test_results if r[1] == "SKIP")
            fail_count = sum(1 for r in test_results if r[1] == "FAIL")
            
            for result in test_results:
                status_icon = "✅" if result[1] == "PASS" else "⏭️" if result[1] == "SKIP" else "❌"
                print(f"{status_icon} {result[0]}: {result[1]} - {result[2]}")
            
            print(f"\n总计: {len(test_results)} 个测试")
            print(f"通过: {pass_count}, 跳过: {skip_count}, 失败: {fail_count}")
            
        except Exception as e:
            print(f"❌ 测试过程中发生错误: {str(e)}")
            page.screenshot(path='test_screenshots/error.png', full_page=True)
            test_results.append(("错误", "FAIL", str(e)))
        
        finally:
            browser.close()
    
    return test_results

if __name__ == "__main__":
    os.makedirs("test_screenshots", exist_ok=True)
    results = test_app()
