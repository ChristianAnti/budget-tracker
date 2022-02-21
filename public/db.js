let db;

const request = indexedDB.open("budgetDB", 1);

request.onupgradeneeded = (event) => {
    console.log("this is working");
    db = event.target.result;
    db.createObjectStore("budgetStore", { autoIncrement: true });
};

request.onerror = function (event) {
    console.log(event.target.errorCode);
};

request.onsuccess = (event) => {
    console.log("success");
    if (navigator.onLine) {
        checkDB();
    }
};

const saveRecord = (record) => {
    console.log("Record Saved offline");
    const transaction = db.transaction(["budgetStore"], "readwrite");
    const store = transaction.objectStore("budgetStore");
    store.add(record);
};

function checkDB() {
    console.log("Checking of db executed");
    const transaction = db.transaction(["budgetStore"], "readwrite");
    const store = transaction.objectStore("budgetStore");
    const getAll = store.getAll();

    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json",
                },
            })
                .then((response) => {
                    return response.json();
                })
                .then(() => {
                    const transaction = db.transaction(["budgetStore"], "readwrite");
                    const store = transaction.objectStore("budgetStore");

                    store.clear();
                    console.log("Store cleared");
                });
        }
    };
}

window.addEventListener("online", checkDB);
