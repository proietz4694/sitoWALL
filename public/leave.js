const form = document.getElementById("traceForm");

form.addEventListener("submit", async (e) => {
e.preventDefault();

const formData = new FormData(form);
const name = formData.get("name").trim();
const message = formData.get("message").trim();
const imageFile = formData.get("image");
const termsAccepted = formData.get("terms");

if (!name || !message) {
alert("Please fill in all required fields.");
return;
}

if (!termsAccepted) {
alert("You must accept the Terms and Conditions.");
return;
}

let imageData = null;

if (imageFile && imageFile.size > 0) {
const reader = new FileReader();
reader.onload = async function () {
imageData = reader.result;
await sendData(name, message, imageData);
};
reader.readAsDataURL(imageFile);
} else {
await sendData(name, message, null);
}
});

async function sendData(name, message, imageData) {
try {
const res = await fetch("/api/messages", {
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({ name, message, image: imageData })
});

const data = await res.json();

if (data.success) {
alert("Your trace has been saved!");
window.location.href = "index.html";
} else {
alert("Error saving your trace.");
}

} catch (err) {
console.error(err);
alert("Server error.");
}
}