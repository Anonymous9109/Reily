const dropdownButton = document.getElementById('dropdownButton');
    const dropdownContent = document.getElementById('dropdownContent');

    // Toggle dropdown visibility
    dropdownButton.addEventListener('click', (event) => {
      event.stopPropagation(); // Prevent click from propagating
      dropdownContent.classList.toggle('show');
    });

    // Close dropdown if clicking outside
    document.addEventListener('click', (event) => {
      if (!dropdownContent.contains(event.target) && dropdownContent.classList.contains('show')) {
        dropdownContent.classList.remove('show');
      }
    });