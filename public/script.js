// ----- Form Leave Your Trace -----
const traceForm = document.getElementById("trace-form");
if (traceForm) {
traceForm.addEventListener("submit", (e) => {
e.preventDefault();
const formData = new FormData(traceForm);

fetch("/api/traces", {
method: "POST",
body: formData,
})
.then((res) => res.json())
.then((res) => {
if (res.success) {
alert("Your trace has been added!");
traceForm.reset();
loadTraces(); // mostra subito nel muro
} else {
alert("Error adding trace.");
}
});
});
}

// ----- Muro permanente -----
function loadTraces() {
const wall = document.getElementById("wall");
if (!wall) return;

fetch("/api/traces")
.then((res) => res.json())
.then((traces) => {
wall.innerHTML = "";
traces.forEach((trace) => {
const div = document.createElement("div");
div.classList.add("trace");
div.innerHTML = `
<strong>${trace.name}</strong>
<p>${trace.message}</p>
${trace.image ? `<img src="${trace.image}" alt="User Image">` : ""}
`;
wall.appendChild(div);
});
});
}

// Carica le tracce all'apertura della pagina
document.addEventListener("DOMContentLoaded", loadTraces);