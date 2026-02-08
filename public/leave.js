document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("traceForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const text = document.getElementById("text").value.trim();
        const imageInput = document.getElementById("image");

        if (!name || !text) return alert("Please enter name and message.");

        // Mostriamo un feedback di caricamento
        const submitBtn = form.querySelector('button');
        const originalBtnText = submitBtn.innerText;
        submitBtn.innerText = "Sending...";
        submitBtn.disabled = true;

        const formData = new FormData();
        formData.append("name", name);
        formData.append("text", text);
        if (imageInput && imageInput.files.length > 0) {
            formData.append("image", imageInput.files[0]);
        }

        try {
            const res = await fetch("/api/messages", {
                method: "POST",
                body: formData
            });

            const result = await res.json();

            if (result.success) {
                // Messaggio salvato con successo - redirect alla home
                alert("✨ Your trace has been left successfully!");
                window.location.href = "/index.html?success=true";
            } else {
                alert("Error: " + (result.error || "Unknown error"));
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
            }
        } catch (err) {
            console.error(err);
            alert("Server connection error.");
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
        }
    });
});