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

// Aggiorniamo il muro solo se esiste
const wall = document.getElementById("wall");
if (wall) loadTraces();
} else {
alert("Error adding trace.");
}
});
});
}

// ----- Muro permanente (solo homepage) -----
function loadTraces() {
const wall = document.getElementById("wall");
if (!wall) return; // Se non esiste, esci

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

// ----- Carica le tracce solo se siamo sulla homepage -----
document.addEventListener("DOMContentLoaded", () => {
const wall = document.getElementById("wall");
if (wall) loadTraces();
});