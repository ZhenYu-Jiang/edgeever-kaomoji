import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const symbol='( •̀ ω •́ )✧',key='kaomoji.preferences.v2';
async function open(page){await page.goto('/');await expect(page.locator('.km-root')).toHaveAttribute('aria-busy','false');await page.getByText('自定义与备份',{exact:true}).click();}
async function add(page,text=symbol,label='我的加油',tags='努力 fight'){await page.getByLabel('表情内容',{exact:true}).fill(text);await page.getByLabel('名称（可选）',{exact:true}).fill(label);await page.getByLabel('搜索关键词（可选）',{exact:true}).fill(tags);await page.getByRole('button',{name:'保存自定义',exact:true}).click();await expect(page.locator('.km-manage-message')).toContainText('已保存');}
async function importFile(page,data){await page.getByLabel('导入收藏备份',{exact:true}).setInputFiles({name:'favorites.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});}
test('旧版收藏和模式迁移，保留原始存储',async({page})=>{
  const legacy={favorites:['🎂'],recent:['🎂'],mode:'copy'};
  await page.addInitScript(value=>localStorage.setItem('kaomoji.preferences.v1',JSON.stringify(value)),legacy);await open(page);
  await expect(page.getByRole('button',{name:'收藏 1',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'复制',exact:true})).toHaveAttribute('aria-pressed','true');await add(page);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('kaomoji.preferences.v1')))).toEqual(legacy);
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).favorites,key)).toEqual(['🎂',symbol]);
});
test('自定义可搜索、编辑、复制，重新打开保留；删除只影响该条目',async({page})=>{
  await open(page);await add(page);await page.getByRole('searchbox').fill('fight');await expect(page.locator('.km-pick')).toHaveCount(1);
  await page.getByRole('button',{name:'复制',exact:true}).click();await page.getByRole('button',{name:'复制 '+symbol,exact:true}).click();expect(await page.evaluate(()=>host.copied)).toEqual([symbol]);
  await page.getByRole('button',{name:'编辑 '+symbol,exact:true}).click();await page.getByLabel('名称（可选）',{exact:true}).fill('新的名称');await page.getByRole('button',{name:'保存自定义',exact:true}).click();await expect(page.locator('.km-label')).toHaveText('新的名称');
  await page.reload();await expect(page.locator('.km-root')).toHaveAttribute('aria-busy','false');await page.getByRole('button',{name:'自定义 1',exact:true}).click();await expect(page.locator('.km-label')).toHaveText('新的名称');
  page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'删除 '+symbol,exact:true}).click();await expect(page.getByRole('button',{name:'自定义 0',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'最近 0',exact:true})).toBeVisible();
});
test('实际导出 JSON，导入先预览并合并去重，保留本机名称和原收藏',async({page})=>{
  await open(page);await add(page);
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'导出收藏备份'}).click();const file=await download;const data=JSON.parse(await readFile(await file.path(),'utf8'));
  expect(data.custom[0].text).toBe(symbol);expect(data.favorites).toEqual([symbol]);
  data.custom[0].label='来自备份的名称';data.custom.push({text:'ᕕ( ᐛ )ᕗ',label:'出发',tags:'出门'});data.favorites.push('ᕕ( ᐛ )ᕗ','🎂');
  await importFile(page,data);await expect(page.locator('.km-manage-message')).toContainText('待合并');await expect(page.getByRole('button',{name:'自定义 1',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'合并导入',exact:true}).click();await expect(page.locator('.km-manage-message')).toContainText('已合并导入');
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);expect(saved.custom).toHaveLength(2);expect(saved.custom[0].label).toBe('我的加油');expect(saved.favorites).toEqual([symbol,'ᕕ( ᐛ )ᕗ','🎂']);
});
test('非法或不完整备份不写入，不把 HTML 当界面执行',async({page})=>{
  await open(page);await add(page,'<img src=x onerror=alert(1)>','安全文本','文字');await expect(page.locator('.km-card img')).toHaveCount(0);
  const baseline=await page.evaluate(()=>host.writes.length);
  for(const data of [{plugin:'wrong',version:2},{plugin:'com.example.kaomoji',version:2,custom:[],favorites:['未知条目']},{plugin:'com.example.kaomoji',version:2,custom:[{text:'x'.repeat(201),label:'',tags:''}],favorites:[]}]){
    await importFile(page,data);await expect(page.locator('.km-manage-message')).toContainText('未导入');await expect(page.getByRole('button',{name:'合并导入',exact:true})).toBeHidden();
  }
  expect(await page.evaluate(()=>host.writes.length)).toBe(baseline);
});
test('自定义存储失败保留会话内容供导出，窄屏管理区可用',async({page})=>{
  await page.setViewportSize({width:360,height:900});await open(page);await page.evaluate(()=>host.failWrite=true);
  await page.getByLabel('表情内容',{exact:true}).fill(symbol);await page.getByRole('button',{name:'保存自定义',exact:true}).click();await expect(page.locator('.km-manage-message')).toContainText('本机保存失败');await expect(page.locator('.km-pick')).toHaveCount(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'test-results/kaomoji-custom-narrow.png',fullPage:true});
});

test('导入预览后删除本机条目，不会合并悬空的收藏',async({page})=>{
  await open(page);await add(page);
  await importFile(page,{plugin:'com.example.kaomoji',version:2,custom:[],favorites:[symbol]});await expect(page.locator('.km-manage-message')).toContainText('待合并');
  page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'删除 '+symbol,exact:true}).click();
  await page.getByRole('button',{name:'合并导入',exact:true}).click();await expect(page.locator('.km-manage-message')).toContainText('本机条目已变化');await expect(page.getByRole('button',{name:'收藏 0',exact:true})).toBeVisible();
});
