/* Universal Video Speed - background service worker.
 *
 * The toolbar icon has no popup; clicking it simply toggles the in-page speed
 * panel. We relay that click to the active tab's content script. activeTab
 * (granted to us the moment the user clicks the icon) is what lets us message
 * the page without requesting broad host permissions up front.
 */
chrome.action.onClicked.addListener((tab) => {
  if (tab.id == null) return;
  chrome.tabs.sendMessage(tab.id, { type: "uvs-toggle" }).catch(() => {
    // No content script in this tab (chrome:// pages, the Web Store, the PDF
    // viewer, etc.) - there's nothing to toggle, so ignore the "no receiver".
  });
});
