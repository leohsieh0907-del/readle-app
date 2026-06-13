/** 全站輕量提示（toast）— 任何地方呼叫 toast('已加入收藏') 即可 */
export function toast(message: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('readle:toast', { detail: { message } }));
}
