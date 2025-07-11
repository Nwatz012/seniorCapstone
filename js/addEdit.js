
        function switchTab(tabName) {
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Remove active class from all tabs
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected tab content
            document.getElementById(tabName + '-content').classList.add('active');
            
            // Add active class to clicked tab
            event.target.classList.add('active');
        }

        // Photo upload preview
        document.getElementById('photo-input').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const photoUpload = document.querySelector('.photo-upload');
                    photoUpload.style.backgroundImage = `url(${e.target.result})`;
                    photoUpload.style.backgroundSize = 'cover';
                    photoUpload.style.backgroundPosition = 'center';
                    photoUpload.innerHTML = '<span style="background: rgba(0,0,0,0.7); color: white; padding: 8px 12px; border-radius: 6px;">Change Photo</span>';
                };
                reader.readAsDataURL(file);
            }
        });

        // Form validation
        document.querySelector('.btn-primary').addEventListener('click', function() {
            const name = document.getElementById('name').value;
            const category = document.getElementById('category').value;
            
            if (!name.trim()) {
                alert('Please enter an item name');
                return;
            }
            
            if (!category) {
                alert('Please select a category');
                return;
            }
            
            // Simulate save success
            alert('Item saved successfully!');
        });
