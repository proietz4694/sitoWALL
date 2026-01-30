document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("traceForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const text = document.getElementById("text").value.trim();
        const imageInput = document.getElementById("image");

        if (!name || !text) return alert("Please enter name and sentence.");

        // Mostriamo un feedback di caricamento
        const submitBtn = form.querySelector('button');
        const originalBtnText = submitBtn.innerText;
        submitBtn.innerText = "Processing...";
        submitBtn.disabled = true;

        const formData = new FormData();
        formData.append("name", name);
        formData.append("text", text);
        if (imageInput && imageInput.files.length > 0) formData.append("image", imageInput.files[0]);

        try {
            const res = await fetch("/api/create-checkout-session", {
                method: "POST",
                body: formData
            });

            const result = await res.json();

            if (result.url) {
                // Reindirizzamento alla pagina di pagamento di Stripe (o successo simulato)
                window.location.href = result.url;
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