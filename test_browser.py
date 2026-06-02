from playwright.sync_api import sync_playwright
import os

def test_app():
    os.makedirs("test_screenshots", exist_ok=True)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 390, 'height': 844})
        page = context.new_page()
        
        print("=" * 60)
        print("蜜蜂记账 App 功能检查")
        print("=" * 60)
        
        try:
            print("\n[1] 打开首页...")
            page.goto('http://localhost:5186/')
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(1000)
            page.screenshot(path='test_screenshots/01_home.png', full_page=True)
            print("  ✅ 首页加载成功")
            
            print("\n[2] 检查导航栏...")
            nav_items = page.locator('nav button, nav a').all()
            print(f"  找到 {len(nav_items)} 个导航项")
            
            print("\n[3] 测试统计页面...")
            stats_btn = page.locator('button:has-text("统计"), a:has-text("统计")').first
            if stats_btn.count() > 0:
                stats_btn.click()
                page.wait_for_load_state('networkidle')
                page.wait_for_timeout(500)
                page.screenshot(path='test_screenshots/02_stats.png', full_page=True)
                print("  ✅ 统计页面加载成功")
            else:
                print("  ⚠️ 未找到统计按钮")
            
            print("\n[4] 测试预算页面...")
            budget_btn = page.locator('button:has-text("预算"), a:has-text("预算")').first
            if budget_btn.count() > 0:
                budget_btn.click()
                page.wait_for_load_state('networkidle')
                page.wait_for_timeout(500)
                page.screenshot(path='test_screenshots/03_budget.png', full_page=True)
                print("  ✅ 预算页面加载成功")
            else:
                print("  ⚠️ 未找到预算按钮")
            
            print("\n[5] 测试我的页面...")
            profile_btn = page.locator('button:has-text("我的"), a:has-text("我的")').first
            if profile_btn.count() > 0:
                profile_btn.click()
                page.wait_for_load_state('networkidle')
                page.wait_for_timeout(500)
                page.screenshot(path='test_screenshots/04_profile.png', full_page=True)
                print("  ✅ 我的页面加载成功")
                
                print("\n[6] 检查商户管理入口...")
                merchant_btn = page.locator('button:has-text("商户管理")').first
                if merchant_btn.count() > 0:
                    print("  ✅ 商户管理入口存在")
                    merchant_btn.click()
                    page.wait_for_timeout(500)
                    page.screenshot(path='test_screenshots/05_merchant_manager.png', full_page=True)
                    print("  ✅ 商户管理弹窗打开成功")
                    
                    close_btn = page.locator('button:has-text("商户管理")').locator('..').locator('button').first
                    page.keyboard.press('Escape')
                    page.wait_for_timeout(300)
                else:
                    print("  ⚠️ 未找到商户管理入口")
                
                print("\n[7] 检查分类管理入口...")
                page.screenshot(path='test_screenshots/06_profile_full.png', full_page=True)
                category_btn = page.locator('button:has-text("分类管理")').first
                if category_btn.count() > 0:
                    print("  ✅ 分类管理入口存在")
                else:
                    print("  ⚠️ 未找到分类管理入口")
            else:
                print("  ⚠️ 未找到我的按钮")
            
            print("\n[8] 测试记账页面...")
            page.goto('http://localhost:5186/')
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(300)
            
            add_btn = page.locator('button:has-text("记账"), a:has-text("记账")').first
            if add_btn.count() > 0:
                add_btn.click()
                page.wait_for_load_state('networkidle')
                page.wait_for_timeout(500)
                page.screenshot(path='test_screenshots/07_add_record.png', full_page=True)
                print("  ✅ 记账页面加载成功")
            else:
                print("  ⚠️ 未找到记账按钮")
            
            print("\n" + "=" * 60)
            print("功能检查完成！")
            print("=" * 60)
            print("\n截图已保存到 test_screenshots/ 目录")
            
        except Exception as e:
            print(f"\n❌ 检查过程中发生错误: {str(e)}")
            page.screenshot(path='test_screenshots/error.png', full_page=True)
        
        finally:
            browser.close()

if __name__ == "__main__":
    test_app()
