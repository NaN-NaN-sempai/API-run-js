// run

var data = {
    raun: `2+5`
};

fetch("/run", {
    method: "POST",
    headers: {'Content-Type': 'application/json'}, 
    body: JSON.stringify(data)
})
.then(res=>res.json())
.then(console.log);