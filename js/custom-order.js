/* ============================================
   CUSTOM ORDER HANDLER
   ============================================ */

class CustomOrderManager {
    constructor() {
        this.uploadedFile = null;
        this.fileVolume = null;
        this.stlViewer = null; // 3D viewer for uploaded STL
    }

    init() {
        const uploadZone = document.getElementById('upload-zone');
        const fileInput = document.getElementById('custom-file-input');
        const fileInfo = document.getElementById('upload-file-info');
        const estimateBtn = document.getElementById('estimate-btn');
        const fileRemove = document.getElementById('file-remove');

        if (!uploadZone) return;

        // Click to upload
        uploadZone.addEventListener('click', () => fileInput.click());

        // Drag and drop
        uploadZone.addEventListener('dragover', e => {
            e.preventDefault();
            uploadZone.classList.add('drag-over');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('drag-over');
        });

        uploadZone.addEventListener('drop', e => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) this.handleFile(files[0]);
        });

        // File input change
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) this.handleFile(fileInput.files[0]);
        });

        // Remove file
        if (fileRemove) {
            fileRemove.addEventListener('click', () => this.removeFile());
        }

        // Estimate button
        if (estimateBtn) {
            estimateBtn.addEventListener('click', () => this.calculateEstimate());
        }
    }

    handleFile(file) {
        const modelExtensions = ['.stl', '.obj', '.3mf', '.step', '.stp'];
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        const allValid = [...modelExtensions, ...imageExtensions];

        if (!allValid.includes(ext)) {
            showToast('⚠️', `Invalid file type. Accepted: ${allValid.join(', ')}`);
            return;
        }

        if (file.size > 100 * 1024 * 1024) {
            showToast('⚠️', 'File too large. Maximum size is 100MB.');
            return;
        }

        this.uploadedFile = file;
        const isImage = imageExtensions.includes(ext);

        // Update UI
        document.getElementById('upload-zone').style.display = 'none';
        const fileInfo = document.getElementById('upload-file-info');
        fileInfo.classList.add('visible');
        document.getElementById('uploaded-file-name').textContent = file.name;
        document.getElementById('uploaded-file-size').textContent = this.formatFileSize(file.size);

        // Update icon based on file type
        const iconEl = document.getElementById('file-type-icon');
        if (iconEl) iconEl.textContent = isImage ? '🖼️' : '📄';

        if (isImage) {
            // Show photo preview
            this.showPhotoPreview(file);
            this.fileVolume = null;
            showToast('🖼️', 'Photo uploaded! Fill in dimensions for a price estimate.');
        } else if (ext === '.stl') {
            this.hidePhotoPreview();
            this.parseAndShowSTL(file);
        } else {
            this.hidePhotoPreview();
            this.fileVolume = null;
            showToast('📄', 'File uploaded! STL files will show a 3D preview.');
        }
    }

    removeFile() {
        this.uploadedFile = null;
        this.fileVolume = null;
        document.getElementById('upload-zone').style.display = 'block';
        document.getElementById('upload-file-info').classList.remove('visible');
        document.getElementById('custom-file-input').value = '';
        document.getElementById('estimate-result').classList.remove('visible');

        // Destroy previews
        this.destroySTLViewer();
        this.hidePhotoPreview();
    }

    showPhotoPreview(file) {
        this.destroySTLViewer(); // hide 3D viewer if any
        const container = document.getElementById('photo-preview-container');
        const img = document.getElementById('photo-preview-img');
        if (!container || !img) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target.result;
            container.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }

    hidePhotoPreview() {
        const container = document.getElementById('photo-preview-container');
        if (container) container.style.display = 'none';
        const img = document.getElementById('photo-preview-img');
        if (img) img.src = '';
    }

    destroySTLViewer() {
        if (this.stlViewer) {
            this.stlViewer.destroy();
            this.stlViewer = null;
        }
        const previewContainer = document.getElementById('stl-preview-container');
        if (previewContainer) {
            previewContainer.style.display = 'none';
        }
    }

    async parseAndShowSTL(file) {
        try {
            const buffer = await file.arrayBuffer();

            // Parse geometry using our STL loader
            const geometry = SimpleSTLLoader.parse(buffer);

            if (geometry && geometry.attributes.position.count > 0) {
                // Calculate volume from the geometry
                this.fileVolume = this.calculateVolumeFromGeometry(geometry);

                // Show 3D preview
                this.show3DPreview(geometry);

                showToast('✅', '3D model loaded! Rotate it below.');
            } else {
                this.fileVolume = null;
                showToast('⚠️', 'Could not parse STL file.');
            }
        } catch (e) {
            console.warn('Could not parse STL:', e);
            this.fileVolume = null;
            showToast('⚠️', 'Error reading STL file.');
        }
    }

    calculateVolumeFromGeometry(geometry) {
        const pos = geometry.attributes.position;
        let volume = 0;

        for (let i = 0; i < pos.count; i += 3) {
            const v1x = pos.getX(i), v1y = pos.getY(i), v1z = pos.getZ(i);
            const v2x = pos.getX(i + 1), v2y = pos.getY(i + 1), v2z = pos.getZ(i + 1);
            const v3x = pos.getX(i + 2), v3y = pos.getY(i + 2), v3z = pos.getZ(i + 2);

            volume += (
                v1x * (v2y * v3z - v3y * v2z) -
                v2x * (v1y * v3z - v3y * v1z) +
                v3x * (v1y * v2z - v2y * v1z)
            ) / 6.0;
        }

        return Math.abs(volume) / 1000; // mm³ to cm³
    }

    show3DPreview(geometry) {
        this.destroySTLViewer();

        const previewContainer = document.getElementById('stl-preview-container');
        if (!previewContainer) return;

        previewContainer.style.display = 'block';
        const viewerDiv = document.getElementById('stl-viewer');
        if (!viewerDiv) return;

        // Clear previous content
        viewerDiv.innerHTML = '';

        // Create a ModelViewer for the STL
        this.stlViewer = new ModelViewer(viewerDiv, {
            backgroundColor: 0x111427,
            autoRotate: true,
            interactive: true
        });

        // Create a mesh from the parsed geometry
        const material = new THREE.MeshPhysicalMaterial({
            color: 0x00D4FF,
            roughness: 0.35,
            metalness: 0.1,
            clearcoat: 0.4,
            clearcoatRoughness: 0.2
        });

        // Center the geometry
        geometry.computeBoundingBox();
        geometry.center();

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;

        const group = new THREE.Group();
        group.add(mesh);

        // Remove default model if any
        if (this.stlViewer.model) {
            this.stlViewer.scene.remove(this.stlViewer.model);
        }

        // Scale to fit viewer
        const box = new THREE.Box3().setFromObject(group);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
            const scale = 2.5 / maxDim;
            group.scale.setScalar(scale);
        }

        this.stlViewer.model = group;
        this.stlViewer.scene.add(group);
    }

    calculateEstimate() {
        const widthInput = document.getElementById('custom-width');
        const heightInput = document.getElementById('custom-height');
        const depthInput = document.getElementById('custom-depth');
        const materialSelect = document.getElementById('custom-material');

        const width = parseFloat(widthInput.value);
        const height = parseFloat(heightInput.value);
        const depth = parseFloat(depthInput.value);
        const materialId = materialSelect.value;

        if (!width || !height || !depth || width <= 0 || height <= 0 || depth <= 0) {
            showToast('⚠️', 'Please enter valid dimensions (width, height, depth).');
            return;
        }

        if (!materialId) {
            showToast('⚠️', 'Please select a material.');
            return;
        }

        // Calculate volume (approximate - real models fill ~30-60% of bounding box)
        let volumeCm3;
        if (this.fileVolume) {
            volumeCm3 = this.fileVolume;
        } else {
            // Estimate: ~35% fill of bounding box for typical 3D prints
            volumeCm3 = width * height * depth * 0.35;
        }

        // Add infill consideration (typically 20% infill)
        const effectiveVolume = volumeCm3 * 0.4; // Shell + 20% infill

        const price = estimateCustomPrice(effectiveVolume, materialId);

        // Show result
        const resultEl = document.getElementById('estimate-result');
        document.getElementById('estimate-price-value').textContent = `$${price.toFixed(2)}`;
        document.getElementById('estimate-volume').textContent = `Estimated volume: ${volumeCm3.toFixed(1)} cm³`;
        resultEl.classList.add('visible');

        showToast('💰', `Estimated price: $${price.toFixed(2)}`);
    }

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
}

window.CustomOrderManager = CustomOrderManager;
