let budgetDataB;

let db;
const request = indexedDB.open("budget", budgetDataB || 21);

request.onupgradeneeded = function (event) {
  console.log('Update needed in IndexDb');
  const { oldVersion } = event;
  const newVersion = event.newVersion || db.version;
  db = event.target.result;
  if (db.objectStoreNames.length === 0) {
    db.createObjectStore("budgetStore", { autoIncrement: true });
  }
};

request.onsuccess = function (event) {
  console.log("success")
  db = event.target.result;

  // check if app is online before reading from db
  if (navigator.onLine) {
    console.log("Backend is now ONLINE!")
    checkDatabase();
  }
};

request.onerror = function(event) {
  console.log("Woops! " + event.target.errorCode);
};

function saveRecord(record) {
  console.log("Saved record invoked")
  const transaction = db.transaction(["budgetStore"], "readwrite");
  const store = transaction.objectStore("budgetStore");

  store.add(record);
}

function checkDatabase() {
  let transaction = db.transaction(["currentStore"], "readwrite");
  const store = transaction.objectStore("budgetStore");
  const getAll = store.getAll();

  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        },
      })
      .then((response) => response.json())
      .then((res) => {
        // delete records if successful
        if(res.length !== 0) {
          let transaction = db.transaction(["budgetStore"], "readwrite");
          const currentStore = transaction.objectStore("budgetStore");
          currentStore.clear();
          console.log('Cleared Store')
        }
        });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);