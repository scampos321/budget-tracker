let budgetDataB;

let db;

const request = indexedDB.open("BudgetDB", budgetVersion || 21);

request.onupgradeneeded = function (e) {
  console.log('Update needed in IndexDb');
  const { oldVersion } = e;
  const newVersion = e.newVersion || db.version;
  console.log(`DB updated from version ${oldVersion} to ${newVersion}`)
  db = e.target.result;
  if (db.objectStoreNames.length === 0) {
    db.createObjectStore("budgetStore", { autoIncrement: true });
  }
};
request.onerror = function(e) {
  console.log(`Woops! ${e.target.errorCode}`);
};

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

request.onsuccess = function (e) {
  console.log("success")
  db = e.target.result;

  // check if app is online before reading from db
  if (navigator.onLine) {
    console.log("Backend is now ONLINE!")
    checkDatabase();
  }
};



function saveRecord(record) {
  console.log("Saved record invoked")
  const transaction = db.transaction(["budgetStore"], "readwrite");
  const store = transaction.objectStore("budgetStore");

  store.add(record);
}



// listen for app coming back online
window.addEventListener("online", checkDatabase);