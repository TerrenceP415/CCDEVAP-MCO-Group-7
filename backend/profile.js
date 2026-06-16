// Profile page: handles editing personal info, profile image upload, and saved passengers
document.addEventListener("DOMContentLoaded", function () {

    // Shows a brief success toast at the bottom of the page
    function showProfileToast(message) {
        var container = document.getElementById("toastContainer");
        if (!container) {
            container = document.createElement("div");
            container.className = "toast-container";
            container.id = "toastContainer";
            document.body.appendChild(container);
        }

        var toast = document.createElement("div");
        toast.className = "toast-notification";
        toast.innerHTML = '<i class="bi bi-check-circle-fill"></i> <span>' + message + '</span>';
        container.appendChild(toast);

        requestAnimationFrame(function () {
            toast.classList.add("show");
        });

        setTimeout(function () {
            toast.classList.remove("show");
            toast.addEventListener("transitionend", function () {
                toast.remove();
            });
        }, 3500);
    }

    // Profile image upload via hidden file input
    var editImageBtn = document.getElementById("editImageBtn");
    var profileImage = document.querySelector(".profile-image");

    if (editImageBtn && profileImage) {
        // Create a hidden file input for image selection
        var fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "image/*";
        fileInput.style.display = "none";
        document.body.appendChild(fileInput);

        editImageBtn.addEventListener("click", function () {
            fileInput.click();
        });

        fileInput.addEventListener("change", function () {
            if (fileInput.files && fileInput.files[0]) {
                var reader = new FileReader();
                reader.onload = function (e) {
                    profileImage.src = e.target.result;
                    showProfileToast("Profile image updated!");
                };
                reader.readAsDataURL(fileInput.files[0]);
            }
        });
    }

    // Personal information edit/save toggle
    var editPersonalBtn  = document.getElementById("editPersonalBtn");
    var savePersonalBtn  = document.getElementById("savePersonalBtn");
    var personalForm     = document.getElementById("personalForm");

    if (editPersonalBtn && savePersonalBtn && personalForm) {
        editPersonalBtn.addEventListener("click", function () {
            // Enable all fields inside the personal form
            var fields = personalForm.querySelectorAll("input");
            fields.forEach(function (f) { f.disabled = false; });
            savePersonalBtn.disabled = false;
            editPersonalBtn.disabled = true;
        });

        savePersonalBtn.addEventListener("click", function () {
            // Disable all fields again (simulate save)
            var fields = personalForm.querySelectorAll("input");
            fields.forEach(function (f) { f.disabled = true; });
            savePersonalBtn.disabled = true;
            editPersonalBtn.disabled = false;
            showProfileToast("Personal information saved!");
        });
    }

    // Saved passengers edit/save/add
    var editPassengerBtn  = document.getElementById("editPassengerBtn");
    var savePassengerBtn  = document.getElementById("savePassengerBtn");
    var addPassengerBtn   = document.getElementById("addPassengerBtn");
    var passengerList     = document.getElementById("passengerList");

    if (editPassengerBtn && savePassengerBtn && passengerList) {
        editPassengerBtn.addEventListener("click", function () {
            var fields = passengerList.querySelectorAll(".passenger-input");
            fields.forEach(function (f) { f.disabled = false; });
            savePassengerBtn.disabled = false;
            editPassengerBtn.disabled = true;
        });

        savePassengerBtn.addEventListener("click", function () {
            var fields = passengerList.querySelectorAll(".passenger-input");
            fields.forEach(function (f) { f.disabled = true; });
            savePassengerBtn.disabled = true;
            editPassengerBtn.disabled = false;
            showProfileToast("Passengers saved!");
        });
    }

    if (addPassengerBtn && passengerList) {
        addPassengerBtn.addEventListener("click", function () {
            var count = passengerList.querySelectorAll(".profile-field").length + 1;

            var field = document.createElement("div");
            field.className = "profile-field";
            field.innerHTML =
                '<label>Passenger ' + count + '</label>' +
                '<input type="text" class="passenger-input" placeholder="Full Name" value="">';

            passengerList.appendChild(field);

            // Auto-enable edit mode when adding a new passenger
            var allFields = passengerList.querySelectorAll(".passenger-input");
            allFields.forEach(function (f) { f.disabled = false; });
            savePassengerBtn.disabled = false;
            editPassengerBtn.disabled = true;
        });
    }
});
