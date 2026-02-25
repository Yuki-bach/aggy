/** インポート画面: 「集計画面へ進む」ボタンの表示制御 */

export function showProceedButton(): void {
  document.getElementById("proceed-btn")!.classList.remove("hidden");
}
