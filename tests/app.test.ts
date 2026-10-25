import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

test('app switches tabs, opens/closes editor twice, preserves one-way route, and has no fabricated AI result', async () => {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost:3000', pretendToBeVisual: true });
  for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'SVGElement', 'Node', 'localStorage', 'location', 'getComputedStyle']) {
    Object.defineProperty(globalThis, name, { value: (dom.window as any)[name], configurable: true, writable: true });
  }
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { value: true, configurable: true });
  class ResizeObserver { observe() {} unobserve() {} disconnect() {} }
  Object.defineProperty(globalThis, 'ResizeObserver', { value: ResizeObserver, configurable: true });
  dom.window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false, onchange: null, media: '' });
  dom.window.confirm = () => true;
  const { act, createElement } = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { default: App } = await import('../src/App');
  const root = createRoot(document.getElementById('root')!);
  function button(text: string) {
    const found = [...document.querySelectorAll('button')].find(b => b.textContent?.trim() === text || b.getAttribute('title') === text || b.getAttribute('aria-label') === text);
    assert.ok(found, `Missing button: ${text}`);
    return found;
  }
  const click = async (text: string) => { await act(async () => button(text).click()); };
  try {
    await act(async () => root.render(createElement(App)));
    assert.ok(document.body.textContent?.includes('Đội QLVH'));
    await click('Một chiềuKết thúc trụ cuối');
    const vehicle = [...document.querySelectorAll('button')].find(b => b.textContent?.includes('Xe cẩu/tải'))!;
    await act(async () => vehicle.click());
    await click('Bảng kê trụ (8)');
    for (let n = 0; n < 2; n++) {
      await click('Chỉnh sửa chi tiết thông tin trụ điện');
      assert.ok(document.querySelector('form'));
      const close = [...document.querySelectorAll('button')].find(b => b.getAttribute('aria-label')?.includes('Đóng'))!;
      assert.ok(close);
      await act(async () => close.click());
    }
    await click('Bản đồ & Lộ trình');
    const selectedOneWay = button('Một chiềuKết thúc trụ cuối');
    assert.match(selectedOneWay.className, /border-emerald-600/);
    await click('Chụp ảnh AI');
    assert.equal(document.querySelectorAll('button').length > 0, true);
    assert.ok(document.body.textContent?.includes('Chưa') || document.body.textContent?.includes('phân tích'));
    assert.equal(document.body.textContent?.includes('94%'), false, 'No fabricated initial AI result');
    await click('Nhập & Check-in');
    await click('Sửa hệ số TH-01');
    const vat = [...document.querySelectorAll('select')].find(s => [...s.options].some(o => o.textContent?.includes('8%')))!;
    assert.ok(vat);
    await act(async () => { vat.value = '0'; vat.dispatchEvent(new dom.window.Event('change', { bubbles: true })); });
    await click('Áp dụng hệ số');
    await act(async () => document.querySelector('#manual-checkin-form')!.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })));
    const stored = JSON.parse(localStorage.getItem('evn_poles_data')!);
    assert.equal(stored.length, 9);
    assert.equal(stored[0].estimateOptions.vatRate, 0);
    assert.equal(stored[0].evnCostBreakdown.vatAmount, 0);
    await click('Bản đồ & Lộ trình');
    assert.match(button('Một chiềuKết thúc trụ cuối').className, /border-emerald-600/);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});
