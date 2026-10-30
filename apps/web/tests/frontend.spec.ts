import {test,expect,type Page} from '@playwright/test';
const stored=(page:Page)=>page.evaluate(()=>JSON.parse(localStorage.getItem('tbci-demo-v1')||'{}'));
const open=(page:Page,path:string)=>page.goto(path).then(()=>page.locator('h1').waitFor());
test('landing has no standalone index-dynamics block and login directly opens account',async({page})=>{
 await page.goto('/');await expect(page.getByRole('heading',{name:/Структура рынка\..*Ясность данных\./})).toBeVisible();await expect(page.getByRole('heading',{name:'Динамика индекса',exact:true})).toHaveCount(0);
 await page.screenshot({path:'test-results/landing-desktop.png',fullPage:true});
 await page.getByRole('link',{name:'Войти',exact:true}).click();await expect(page).toHaveURL(/\/app\/$/);await expect(page.getByRole('heading',{name:'Обзор портфеля',exact:true})).toBeVisible();await expect(page.locator('input[type=password]')).toHaveCount(0);
 await page.screenshot({path:'test-results/account-desktop.png',fullPage:true});
});
test('public basket expands and newsletter states that demo does not transmit data',async({page})=>{
 await page.goto('/');const expand=page.getByRole('button',{name:'Посмотреть весь состав'});await expand.scrollIntoViewIfNeeded();await expect(page.locator('astro-island[component-export="Composition"]')).not.toHaveAttribute('ssr','');await expand.click();await expect(page.getByRole('row').filter({hasText:'Qtum'})).toBeVisible();await page.getByRole('button',{name:'Свернуть состав'}).click();await expect(page.getByRole('row').filter({hasText:'Qtum'})).toHaveCount(0);
 const email=page.getByRole('textbox',{name:'Ваш email'});await email.scrollIntoViewIfNeeded();await expect(page.locator('astro-island[component-export="Subscribe"]')).not.toHaveAttribute('ssr','');await email.fill('preview@example.com');await page.getByRole('button',{name:'Подписаться',exact:true}).click();await expect(page.getByRole('status')).toContainText('не отправляется');
});
test('all cabinet sections resolve without authentication',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const [path,title] of [['wallets','Мои кошельки'],['indices','Выбор индекса'],['buy','Покупка TBCi'],['compile','Сборка TBCi'],['sell','Продажа TBCi'],['unmake','Разборка TBCi'],['history','История'],['holders','Держатели TBCi'],['settings','Настройки'],['help','Помощь']]){
  const r=await page.goto(`/app/${path}/`);expect(r?.status()).toBe(200);await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();
 }
 expect(errors).toEqual([]);
});
test('buy debits payment plus fee and persists a single operation',async({page})=>{
 await open(page,'/app/buy/');await page.getByLabel('Сколько TBCi хотите купить?').fill('1');await page.getByRole('button',{name:'Купить TBCi',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Подтвердить покупку'}).click();
 await expect.poll(async()=>(await stored(page)).balances.TBCi).toBe(85.5);expect((await stored(page)).balances.USDC).toBeCloseTo(6379.4,6);expect((await stored(page)).operations).toHaveLength(7);
 await page.reload();await expect(page.getByRole('heading',{name:'Покупка TBCi'})).toBeVisible();expect((await stored(page)).balances.TBCi).toBe(85.5);
});
test('sell credits the chosen asset net of fee',async({page})=>{
 await open(page,'/app/sell/');await page.getByLabel('Сколько TBCi хотите продать?').fill('2');await page.getByRole('button',{name:'Продать TBCi',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Подтвердить продажу'}).click();
 await expect.poll(async()=>(await stored(page)).balances.TBCi).toBe(82.5);expect((await stored(page)).balances.USDC).toBeCloseTo(6738.8,6);
});
test('compile checks all components and creates tokens',async({page})=>{
 await open(page,'/app/compile/');await expect(page.getByRole('button',{name:'Собрать TBCi',exact:true})).toBeDisabled();await page.getByRole('button',{name:'Рассчитать',exact:true}).click();await expect(page.getByRole('button',{name:'Собрать TBCi',exact:true})).toBeEnabled();await page.getByRole('button',{name:'Собрать TBCi',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Подтвердить сборку'}).click();await expect.poll(async()=>(await stored(page)).balances.TBCi).toBe(94.5);expect((await stored(page)).balances.BTC).toBeCloseTo(.4-1200*.45/67350*1.005,7);
});
test('unmake reduces tokens and returns all basket components net of fee',async({page})=>{
 await open(page,'/app/unmake/');await page.getByLabel('Сколько TBCi хотите разобрать?').fill('2');await page.getByRole('button',{name:'Рассчитать',exact:true}).click();await page.getByRole('button',{name:'Разобрать TBCi',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Подтвердить разборку'}).click();await expect.poll(async()=>(await stored(page)).balances.TBCi).toBe(82.5);expect((await stored(page)).balances.BTC).toBeCloseTo(.4+240*.45/67350*.995,7);
});
test('insufficient and negative amounts cannot be submitted',async({page})=>{
 await open(page,'/app/buy/');await page.getByLabel('Сколько TBCi хотите купить?').fill('10000');await expect(page.getByRole('button',{name:'Купить TBCi',exact:true})).toBeDisabled();await expect(page.getByRole('alert')).toContainText('Недостаточно USDC');await page.getByLabel('Сколько TBCi хотите купить?').fill('-1');await expect(page.getByRole('button',{name:'Купить TBCi',exact:true})).toBeDisabled();
});
test('wallet deposit and withdrawal update demo balances',async({page})=>{
 await open(page,'/app/wallets/');const row=page.getByRole('row').filter({hasText:'USD Coin'});await row.getByRole('button',{name:'Пополнить',exact:true}).click();await page.getByLabel('Сумма, USDC').fill('250');await page.getByRole('button',{name:'Пополнить баланс',exact:true}).click();await expect.poll(async()=>(await stored(page)).balances.USDC).toBe(6750);
 await row.getByRole('button',{name:'Вывести',exact:true}).click();await page.getByLabel('Сумма, USDC').fill('25');await page.getByLabel('Адрес получения').fill('demo-destination');await page.getByRole('button',{name:'Подтвердить вывод',exact:true}).click();await expect.poll(async()=>(await stored(page)).balances.USDC).toBe(6725);
});
test('history filters and CSV export work',async({page})=>{
 await open(page,'/app/history/');await page.getByLabel('Тип операции', {exact:true}).selectOption('buy');await expect(page.locator('tbody tr')).toHaveCount(1);const download=page.waitForEvent('download');await page.getByRole('button',{name:'Экспорт CSV'}).click();expect((await download).suggestedFilename()).toBe('tbci-operations.csv');await page.getByLabel('Статус',{exact:true}).selectOption('pending');await expect(page.getByText('Операции не найдены')).toBeVisible();
});
test('settings save and reset the local demo',async({page})=>{
 await open(page,'/app/settings/');await page.getByLabel('Имя',{exact:true}).fill('Мария');await page.getByRole('button',{name:'Сохранить изменения'}).click();await expect(page.locator('.sidebar-profile strong')).toHaveText('Мария');await page.reload();await expect(page.getByLabel('Имя',{exact:true})).toHaveValue('Мария');await page.getByRole('button',{name:'Сбросить демо-данные'}).click();await page.getByRole('dialog').getByRole('button',{name:'Сбросить демо',exact:true}).click();await expect(page.getByLabel('Имя',{exact:true})).toHaveValue('Александр');
});
test('landing and every account screen fit mobile widths; drawer opens',async({page})=>{
 test.setTimeout(90_000);
 for(const width of [375,320])for(const path of ['/','/app/','/app/wallets/','/app/indices/','/app/buy/','/app/compile/','/app/unmake/','/app/history/','/app/holders/','/app/settings/','/app/help/']){
  await page.setViewportSize({width,height:850});await open(page,path);await page.evaluate(()=>document.fonts.ready);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${path} at ${width}px`).toBeTruthy();
 }
 await page.goto('/app/');await page.getByRole('button',{name:'Открыть меню кабинета'}).click();await expect(page.getByRole('navigation',{name:'Разделы кабинета'})).toBeVisible();await page.getByRole('button',{name:'Закрыть меню',exact:true}).click();await page.screenshot({path:'test-results/account-mobile.png',fullPage:true});await page.goto('/');await page.screenshot({path:'test-results/landing-mobile.png',fullPage:true});
});
