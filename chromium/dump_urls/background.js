chrome.action.onClicked.addListener(async (tab) => {
  // Get tabs from all incognito windows
  const tabs = await chrome.tabs.query({ windowType: "normal" });
  const incognitoTabs = tabs.filter(t => t.incognito);

  if (incognitoTabs.length === 0) {
    console.log("No incognito tabs found.");
    return;
  }

  // Deduplicate by URL, keeping the longest title for each
  const tabMap = {};
  incognitoTabs.forEach(t => {
    if ((tabMap[t.url] || "").length < t.title.length) tabMap[t.url] = t.title;
  });
  const urls = Object.entries(tabMap).map(([url, title]) => `${url}  (${title})`).join("\n");

  // Create a blob URL for the text file
  const blob = new Blob([urls], { type: "text/plain" });
  const dataUrl = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(urls)))}`;


  // Trigger a download to save the file
  chrome.downloads.download({
    url: dataUrl,
    filename: `saved_tabs_${new Date().toISOString().slice(0,19).replace(/:/g,"-")}.txt`,
    saveAs: false // set to true if you want a "Save As" dialog
  });
});