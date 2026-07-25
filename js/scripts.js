window.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-current-year]").forEach((element) => {
        element.textContent = new Date().getFullYear();
    });

    const form = document.querySelector("#contactForm");
    if (!form) {
        return;
    }

    const submitButton = form.querySelector("#submitButton");
    const status = form.querySelector("#formStatus");

    const fields = [
        {
            element: form.querySelector("#name"),
            errorId: "nameError",
            validate: (value) => value.trim().length > 0
        },
        {
            element: form.querySelector("#email"),
            errorId: "emailError",
            validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
        },
        {
            element: form.querySelector("#message"),
            errorId: "messageError",
            validate: (value) => value.trim().length > 0
        }
    ];

    const setFieldState = ({ element, errorId, validate }) => {
        const isValid = validate(element.value);
        const wrapper = element.closest(".form-field");
        const error = document.getElementById(errorId);

        wrapper.classList.toggle("has-error", !isValid);
        element.setAttribute("aria-invalid", String(!isValid));

        if (error) {
            if (!isValid) {
                element.setAttribute("aria-describedby", errorId);
            } else {
                element.removeAttribute("aria-describedby");
            }
        }

        return isValid;
    };

    fields.forEach((field) => {
        field.element.addEventListener("input", () => {
            setFieldState(field);
            status.textContent = "";
            status.className = "form-status";
        });
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const validationResults = fields.map((field) => setFieldState(field));
        const isValid = validationResults.every(Boolean);
        status.className = "form-status";

        if (!isValid) {
            status.textContent = "Revisá los campos marcados antes de enviar la consulta.";
            status.classList.add("is-error");
            return;
        }

        submitButton.disabled = true;
        submitButton.classList.add("disabled");
        submitButton.querySelector(".button-label").hidden = true;
        submitButton.querySelector(".button-loading").hidden = false;
        status.textContent = "Enviando consulta...";
        status.classList.add("is-success");

        window.setTimeout(() => {
            if (!form.action) {
                submitButton.disabled = false;
                submitButton.classList.remove("disabled");
                submitButton.querySelector(".button-label").hidden = false;
                submitButton.querySelector(".button-loading").hidden = true;
                status.textContent = "No hay un servicio de envío configurado para este formulario.";
                status.className = "form-status";
                status.classList.add("is-error");
                return;
            }

            form.submit();
        }, 250);
    });
});
