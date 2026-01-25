document.addEventListener("DOMContentLoaded", () => {
const form = document.getElementById("traceForm");
if (!form) return;

form.addEventListener("submit", async (e) => {
e.preventDefault();

const name = document.getElementById("name").value.trim();
const text = document.getElementById("text").value.trim();
const imageInput = document.getElementById("image");

if (!name || !text) return alert("Please enter name and sentence.");

const formData = new FormData();
formData.append("name", name);
formData.append("text", text);
if (imageInput && imageInput.files.length > 0) formData.append("image", imageInput.files[0]);

try {
const res = await fetch("/api/add", { method: "POST", body: formData });
const result = await res.json();
if (result.success) {
alert("Message saved!");
window.location.href = "/";
} else alert("Error saving message.");
} catch(err) {
console.error(err);
alert("Server error.");
}
});
});