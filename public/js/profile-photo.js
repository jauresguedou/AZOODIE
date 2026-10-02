const profilePhotoForm = document.getElementById("profile-photo-form");

if (profilePhotoForm) {
    const photoInput = profilePhotoForm.querySelector('input[type="file"]');

    photoInput.addEventListener("change", () => {
        if (photoInput.files && photoInput.files.length > 0) {
            profilePhotoForm.requestSubmit();
        }
    });
}
