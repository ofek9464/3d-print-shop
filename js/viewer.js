/* ============================================
   THREE.JS 3D MODEL VIEWER
   ============================================ */

class ModelViewer {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            autoRotate: options.autoRotate !== false,
            autoRotateSpeed: options.autoRotateSpeed || 1.5,
            backgroundColor: options.backgroundColor || 0x0B0D17,
            interactive: options.interactive !== false,
            ...options
        };

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.model = null;
        this.animationId = null;
        this.isDestroyed = false;

        this.init();
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.options.backgroundColor);

        // Camera
        const rect = this.container.getBoundingClientRect();
        const aspect = rect.width / rect.height;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        this.camera.position.set(0, 0, 5);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(rect.width, rect.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        this.setupLighting();

        // Controls
        if (this.options.interactive && typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.08;
            this.controls.enablePan = false;
            this.controls.minDistance = 2;
            this.controls.maxDistance = 10;
            this.controls.autoRotate = this.options.autoRotate;
            this.controls.autoRotateSpeed = this.options.autoRotateSpeed;
        }

        // Floor Plane (subtle reflection)
        this.addFloorPlane();

        // Resize
        this.resizeObserver = new ResizeObserver(() => this.onResize());
        this.resizeObserver.observe(this.container);

        // Start render loop
        this.animate();
    }

    setupLighting() {
        // Ambient light
        const ambient = new THREE.AmbientLight(0x404060, 0.6);
        this.scene.add(ambient);

        // Main directional light
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
        mainLight.position.set(5, 8, 5);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 1024;
        mainLight.shadow.mapSize.height = 1024;
        this.scene.add(mainLight);

        // Fill light
        const fillLight = new THREE.DirectionalLight(0x6080ff, 0.4);
        fillLight.position.set(-5, 2, -5);
        this.scene.add(fillLight);

        // Rim light
        const rimLight = new THREE.DirectionalLight(0x00D4FF, 0.3);
        rimLight.position.set(0, -3, -5);
        this.scene.add(rimLight);

        // Top light
        const topLight = new THREE.PointLight(0xffffff, 0.5);
        topLight.position.set(0, 10, 0);
        this.scene.add(topLight);
    }

    addFloorPlane() {
        const geometry = new THREE.PlaneGeometry(20, 20);
        const material = new THREE.MeshStandardMaterial({
            color: 0x0B0D17,
            roughness: 0.8,
            metalness: 0.2,
            transparent: true,
            opacity: 0.5
        });
        const plane = new THREE.Mesh(geometry, material);
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = -1.8;
        plane.receiveShadow = true;
        this.scene.add(plane);
    }

    loadModel(modelType, color = '#2196F3') {
        // Remove existing model
        if (this.model) {
            this.scene.remove(this.model);
            this.disposeObject(this.model);
        }

        const colorObj = new THREE.Color(color);
        const material = new THREE.MeshPhysicalMaterial({
            color: colorObj,
            roughness: 0.35,
            metalness: 0.1,
            clearcoat: 0.4,
            clearcoatRoughness: 0.2,
            reflectivity: 0.5
        });

        let geometry;
        let group = new THREE.Group();

        switch (modelType) {
            case 'torusKnot':
                geometry = new THREE.TorusKnotGeometry(1, 0.35, 128, 32, 2, 3);
                const mesh1 = new THREE.Mesh(geometry, material);
                mesh1.castShadow = true;
                group.add(mesh1);
                break;

            case 'robot':
                group = this.createRobot(material);
                break;

            case 'castle':
                group = this.createCastle(material);
                break;

            case 'stand':
                group = this.createPhoneStand(material);
                break;

            case 'organizer':
                group = this.createOrganizer(material);
                break;

            case 'toolHolder':
                group = this.createToolHolder(material);
                break;

            case 'vase':
                group = this.createVase(material);
                break;

            case 'hexShelf':
                group = this.createHexShelf(material);
                break;

            case 'lampShade':
                group = this.createLampShade(material);
                break;

            case 'controllerStand':
                group = this.createControllerStand(material);
                break;

            case 'diceTower':
                group = this.createDiceTower(material);
                break;

            case 'terrain':
                group = this.createTerrain(material);
                break;

            case 'gear':
                group = this.createGear(material);
                break;

            case 'bearing':
                group = this.createBearing(material);
                break;

            case 'bracket':
                group = this.createBracket(material);
                break;

            case 'wave':
                group = this.createWave(material);
                break;

            case 'geodesic':
                geometry = new THREE.IcosahedronGeometry(1.3, 1);
                const wireGeo = new THREE.IcosahedronGeometry(1.35, 1);
                const wireMat = new THREE.MeshPhysicalMaterial({
                    color: colorObj,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.3
                });
                const solidMesh = new THREE.Mesh(geometry, material);
                solidMesh.castShadow = true;
                const wireMesh = new THREE.Mesh(wireGeo, wireMat);
                group.add(solidMesh);
                group.add(wireMesh);
                break;

            case 'spiral':
                group = this.createSpiral(material);
                break;

            default:
                geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5, 4, 4, 4);
                const defaultMesh = new THREE.Mesh(geometry, material);
                defaultMesh.castShadow = true;
                group.add(defaultMesh);
        }

        this.model = group;
        this.scene.add(this.model);

        // Center and scale model
        const box = new THREE.Box3().setFromObject(this.model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.5 / maxDim;
        this.model.scale.setScalar(scale);
        this.model.position.sub(center.multiplyScalar(scale));
    }

    // Shape Generators
    createRobot(material) {
        const group = new THREE.Group();
        // Body
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 0.8), material);
        body.castShadow = true;
        group.add(body);
        // Head
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.7, 2, 2, 2), material);
        head.position.y = 1.15;
        head.castShadow = true;
        group.add(head);
        // Eyes
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x00D4FF, emissive: 0x00D4FF, emissiveIntensity: 0.8 });
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), eyeMat);
        eyeL.position.set(-0.2, 1.2, 0.35);
        group.add(eyeL);
        const eyeR = eyeL.clone();
        eyeR.position.x = 0.2;
        group.add(eyeR);
        // Arms
        const armGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.2, 8);
        const armL = new THREE.Mesh(armGeo, material);
        armL.position.set(-0.85, 0.1, 0);
        armL.castShadow = true;
        group.add(armL);
        const armR = armL.clone();
        armR.position.x = 0.85;
        group.add(armR);
        // Legs
        const legGeo = new THREE.CylinderGeometry(0.15, 0.15, 1, 8);
        const legL = new THREE.Mesh(legGeo, material);
        legL.position.set(-0.3, -1.25, 0);
        legL.castShadow = true;
        group.add(legL);
        const legR = legL.clone();
        legR.position.x = 0.3;
        group.add(legR);
        // Antenna
        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8), material);
        antenna.position.set(0, 1.7, 0);
        group.add(antenna);
        const antennaBall = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), eyeMat);
        antennaBall.position.set(0, 1.98, 0);
        group.add(antennaBall);
        return group;
    }

    createCastle(material) {
        const group = new THREE.Group();
        // Main wall
        const wall = new THREE.Mesh(new THREE.BoxGeometry(3, 1.2, 2.5), material);
        wall.castShadow = true;
        group.add(wall);
        // Towers
        const towerGeo = new THREE.CylinderGeometry(0.4, 0.45, 2.2, 8);
        const positions = [[-1.4, 0.5, -1.1], [1.4, 0.5, -1.1], [-1.4, 0.5, 1.1], [1.4, 0.5, 1.1]];
        positions.forEach(pos => {
            const tower = new THREE.Mesh(towerGeo, material);
            tower.position.set(...pos);
            tower.castShadow = true;
            group.add(tower);
            // Tower top
            const roofGeo = new THREE.ConeGeometry(0.5, 0.7, 8);
            const roof = new THREE.Mesh(roofGeo, material);
            roof.position.set(pos[0], pos[1] + 1.4, pos[2]);
            roof.castShadow = true;
            group.add(roof);
        });
        // Gate
        const gateMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
        const gate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.1), gateMat);
        gate.position.set(0, -0.25, 1.28);
        group.add(gate);
        return group;
    }

    createPhoneStand(material) {
        const group = new THREE.Group();
        // Base
        const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.15, 1.5), material);
        base.position.y = -0.5;
        base.castShadow = true;
        group.add(base);
        // Back support (angled)
        const back = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2, 0.12), material);
        back.position.set(0, 0.45, -0.4);
        back.rotation.x = -0.15;
        back.castShadow = true;
        group.add(back);
        // Front lip
        const lip = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 0.3), material);
        lip.position.set(0, -0.35, 0.2);
        lip.castShadow = true;
        group.add(lip);
        return group;
    }

    createOrganizer(material) {
        const group = new THREE.Group();
        const base = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 1), material);
        base.castShadow = true;
        group.add(base);
        for (let i = 0; i < 6; i++) {
            const clip = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.05, 8, 16, Math.PI), material);
            clip.position.set(-0.75 + i * 0.3, 0.15, 0);
            clip.rotation.x = Math.PI;
            clip.castShadow = true;
            group.add(clip);
        }
        return group;
    }

    createToolHolder(material) {
        const group = new THREE.Group();
        // Main body
        const body = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.1, 1.5, 12), material);
        body.castShadow = true;
        group.add(body);
        // Holes on top
        const holeMat = new THREE.MeshStandardMaterial({ color: 0x0B0D17 });
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.3, 12), holeMat);
            hole.position.set(Math.cos(angle) * 0.6, 0.65, Math.sin(angle) * 0.6);
            group.add(hole);
        }
        // Center hole
        const centerHole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.3, 16), holeMat);
        centerHole.position.y = 0.65;
        group.add(centerHole);
        return group;
    }

    createVase(material) {
        const points = [];
        for (let i = 0; i < 20; i++) {
            const t = i / 19;
            const r = 0.3 + Math.sin(t * Math.PI) * 0.7 + Math.sin(t * Math.PI * 3) * 0.1;
            points.push(new THREE.Vector2(r, t * 3 - 1.5));
        }
        const geometry = new THREE.LatheGeometry(points, 6); // Low-poly look
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        const group = new THREE.Group();
        group.add(mesh);
        return group;
    }

    createHexShelf(material) {
        const group = new THREE.Group();
        const shape = new THREE.Shape();
        const size = 0.8;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 - Math.PI / 6;
            const x = Math.cos(angle) * size;
            const y = Math.sin(angle) * size;
            if (i === 0) shape.moveTo(x, y);
            else shape.lineTo(x, y);
        }
        shape.closePath();
        // Create hole (inner hex)
        const hole = new THREE.Path();
        const innerSize = size - 0.12;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 - Math.PI / 6;
            const x = Math.cos(angle) * innerSize;
            const y = Math.sin(angle) * innerSize;
            if (i === 0) hole.moveTo(x, y);
            else hole.lineTo(x, y);
        }
        hole.closePath();
        shape.holes.push(hole);
        const extrudeSettings = { depth: 0.5, bevelEnabled: false };
        const hexGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        // Create honeycomb pattern
        const positions = [[0, 0, 0], [1.45, 0.84, 0], [1.45, -0.84, 0]];
        positions.forEach(pos => {
            const hex = new THREE.Mesh(hexGeo, material);
            hex.position.set(...pos);
            hex.castShadow = true;
            group.add(hex);
        });
        return group;
    }

    createLampShade(material) {
        const group = new THREE.Group();
        const points = [];
        for (let i = 0; i < 15; i++) {
            const t = i / 14;
            const r = 0.3 + t * 0.8 + Math.sin(t * Math.PI * 4) * 0.08;
            points.push(new THREE.Vector2(r, t * 2 - 1));
        }
        const geo = new THREE.LatheGeometry(points, 32);
        const shadeMat = material.clone();
        shadeMat.transparent = true;
        shadeMat.opacity = 0.7;
        shadeMat.side = THREE.DoubleSide;
        const shade = new THREE.Mesh(geo, shadeMat);
        shade.castShadow = true;
        group.add(shade);
        // Inner glow
        const glowMat = new THREE.MeshStandardMaterial({
            color: 0xFFD600,
            emissive: 0xFFD600,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.3
        });
        const glowSphere = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), glowMat);
        glowSphere.position.y = -0.3;
        group.add(glowSphere);
        return group;
    }

    createControllerStand(material) {
        const group = new THREE.Group();
        // Base
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 0.2, 24), material);
        base.position.y = -0.6;
        base.castShadow = true;
        group.add(base);
        // Arm
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.2, 0.15), material);
        arm.position.set(0, 0, 0);
        arm.castShadow = true;
        group.add(arm);
        // Cradle
        const cradle = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.08, 8, 24, Math.PI), material);
        cradle.position.y = 0.5;
        cradle.rotation.z = Math.PI;
        cradle.castShadow = true;
        group.add(cradle);
        return group;
    }

    createDiceTower(material) {
        const group = new THREE.Group();
        // Outer shell
        const shell = new THREE.Mesh(new THREE.BoxGeometry(1, 3, 1.2), material);
        shell.castShadow = true;
        group.add(shell);
        // Top opening
        const topMat = new THREE.MeshStandardMaterial({ color: 0x0B0D17 });
        const topHole = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.8), topMat);
        topHole.position.y = 1.47;
        group.add(topHole);
        // Exit ramp
        const ramp = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.6), material);
        ramp.position.set(0, -1.5, 0.9);
        ramp.rotation.x = -0.3;
        ramp.castShadow = true;
        group.add(ramp);
        // Battlements
        for (let i = 0; i < 4; i++) {
            const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 1.2), material);
            merlon.position.set(-0.35 + i * 0.23, 1.6, 0);
            group.add(merlon);
        }
        return group;
    }

    createTerrain(material) {
        const group = new THREE.Group();
        // Ground
        const groundGeo = new THREE.PlaneGeometry(3, 3, 12, 12);
        const vertices = groundGeo.attributes.position;
        for (let i = 0; i < vertices.count; i++) {
            const x = vertices.getX(i);
            const y = vertices.getY(i);
            vertices.setZ(i, Math.sin(x * 2) * Math.cos(y * 2) * 0.3 + Math.random() * 0.08);
        }
        groundGeo.computeVertexNormals();
        const ground = new THREE.Mesh(groundGeo, material);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5;
        ground.castShadow = true;
        group.add(ground);
        // Rocks
        for (let i = 0; i < 3; i++) {
            const rock = new THREE.Mesh(
                new THREE.DodecahedronGeometry(0.2 + Math.random() * 0.2, 0),
                material
            );
            rock.position.set((Math.random() - 0.5) * 2, -0.2 + Math.random() * 0.3, (Math.random() - 0.5) * 2);
            rock.rotation.set(Math.random(), Math.random(), Math.random());
            rock.castShadow = true;
            group.add(rock);
        }
        // Tree-like shapes
        const trunkGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.6, 6);
        const trunk = new THREE.Mesh(trunkGeo, material);
        trunk.position.set(0.5, 0, 0.3);
        group.add(trunk);
        const foliage = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 6), material);
        foliage.position.set(0.5, 0.5, 0.3);
        group.add(foliage);

        return group;
    }

    createGear(material) {
        const group = new THREE.Group();
        const shape = new THREE.Shape();
        const teeth = 12;
        const innerR = 0.7;
        const outerR = 1;
        for (let i = 0; i < teeth; i++) {
            const a1 = (i / teeth) * Math.PI * 2;
            const a2 = ((i + 0.3) / teeth) * Math.PI * 2;
            const a3 = ((i + 0.5) / teeth) * Math.PI * 2;
            const a4 = ((i + 0.8) / teeth) * Math.PI * 2;
            if (i === 0) shape.moveTo(Math.cos(a1) * innerR, Math.sin(a1) * innerR);
            shape.lineTo(Math.cos(a2) * outerR, Math.sin(a2) * outerR);
            shape.lineTo(Math.cos(a3) * outerR, Math.sin(a3) * outerR);
            shape.lineTo(Math.cos(a4) * innerR, Math.sin(a4) * innerR);
            const next = ((i + 1) / teeth) * Math.PI * 2;
            shape.lineTo(Math.cos(next) * innerR, Math.sin(next) * innerR);
        }
        // Center hole
        const hole = new THREE.Path();
        for (let i = 0; i < 24; i++) {
            const a = (i / 24) * Math.PI * 2;
            if (i === 0) hole.moveTo(Math.cos(a) * 0.25, Math.sin(a) * 0.25);
            else hole.lineTo(Math.cos(a) * 0.25, Math.sin(a) * 0.25);
        }
        shape.holes.push(hole);
        const gearGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: false });
        const gear = new THREE.Mesh(gearGeo, material);
        gear.rotation.x = Math.PI / 2;
        gear.castShadow = true;
        group.add(gear);
        return group;
    }

    createBearing(material) {
        const group = new THREE.Group();
        // Outer ring
        const outer = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.2, 16, 32), material);
        outer.rotation.x = Math.PI / 2;
        outer.castShadow = true;
        group.add(outer);
        // Inner ring
        const inner = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.15, 16, 32), material);
        inner.rotation.x = Math.PI / 2;
        inner.castShadow = true;
        group.add(inner);
        // Balls
        const ballMat = new THREE.MeshPhysicalMaterial({
            color: material.color,
            roughness: 0.1,
            metalness: 0.8
        });
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            const ball = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), ballMat);
            ball.position.set(Math.cos(a) * 0.58, 0, Math.sin(a) * 0.58);
            ball.castShadow = true;
            group.add(ball);
        }
        return group;
    }

    createBracket(material) {
        const group = new THREE.Group();
        // Vertical plate
        const vert = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 0.15), material);
        vert.position.set(0, 0.4, 0);
        vert.castShadow = true;
        group.add(vert);
        // Horizontal plate
        const horiz = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.15, 1), material);
        horiz.position.set(0, -0.35, 0.5);
        horiz.castShadow = true;
        group.add(horiz);
        // Gusset
        const gussetShape = new THREE.Shape();
        gussetShape.moveTo(0, 0);
        gussetShape.lineTo(0, 0.8);
        gussetShape.lineTo(0.8, 0);
        gussetShape.closePath();
        const gussetGeo = new THREE.ExtrudeGeometry(gussetShape, { depth: 0.1, bevelEnabled: false });
        const gusset = new THREE.Mesh(gussetGeo, material);
        gusset.position.set(-0.05, -0.35, 0.02);
        gusset.rotation.y = Math.PI / 2;
        gusset.castShadow = true;
        group.add(gusset);
        // Mounting holes
        const holeMat = new THREE.MeshStandardMaterial({ color: 0x0B0D17 });
        const holeGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.2, 16);
        [[-0.4, 0.8, 0.02], [0.4, 0.8, 0.02], [0, 0.2, 0.02]].forEach(pos => {
            const h = new THREE.Mesh(holeGeo, holeMat);
            h.position.set(...pos);
            h.rotation.x = Math.PI / 2;
            group.add(h);
        });
        return group;
    }

    createWave(material) {
        const group = new THREE.Group();
        const geo = new THREE.ParametricGeometry((u, v, target) => {
            const x = (u - 0.5) * 4;
            const z = (v - 0.5) * 4;
            const y = Math.sin(x * 1.5) * Math.cos(z * 1.5) * 0.5 +
                Math.sin(x * 3 + z * 2) * 0.15;
            target.set(x, y, z);
        }, 40, 40);
        const mesh = new THREE.Mesh(geo, material);
        mesh.castShadow = true;
        group.add(mesh);
        return group;
    }

    createSpiral(material) {
        const group = new THREE.Group();
        const points = [];
        for (let i = 0; i < 200; i++) {
            const t = i / 200;
            const angle = t * Math.PI * 6;
            const r = 0.2 + t * 0.8;
            const x = Math.cos(angle) * r;
            const y = t * 2.5 - 1.25;
            const z = Math.sin(angle) * r;
            points.push(new THREE.Vector3(x, y, z));
        }
        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeo = new THREE.TubeGeometry(curve, 100, 0.08, 8, false);
        const tube = new THREE.Mesh(tubeGeo, material);
        tube.castShadow = true;
        group.add(tube);
        // Top bloom
        const petalMat = material.clone();
        for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2;
            const petal = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), petalMat);
            petal.scale.set(1, 0.3, 1.8);
            petal.position.set(
                Math.cos(a) * 0.35 + points[points.length - 1].x,
                points[points.length - 1].y,
                Math.sin(a) * 0.35 + points[points.length - 1].z
            );
            petal.rotation.y = a;
            petal.castShadow = true;
            group.add(petal);
        }
        return group;
    }

    setColor(color) {
        if (!this.model) return;
        const colorObj = new THREE.Color(color);
        this.model.traverse(child => {
            if (child.isMesh && child.material) {
                // Skip materials with actual emissive glow (e.g. robot eyes) — don't recolor those
                if (child.material.emissive &&
                    child.material.emissive.getHex() !== 0x000000 &&
                    child.material.emissiveIntensity > 0.5) return;
                if (child.material.color) {
                    child.material.color.set(colorObj);
                }
            }
        });
    }

    onResize() {
        if (this.isDestroyed) return;
        const rect = this.container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        this.camera.aspect = rect.width / rect.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(rect.width, rect.height);
    }

    animate() {
        if (this.isDestroyed) return;
        this.animationId = requestAnimationFrame(() => this.animate());
        if (this.controls) this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    disposeObject(obj) {
        obj.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
    }

    destroy() {
        this.isDestroyed = true;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (this.resizeObserver) this.resizeObserver.disconnect();
        if (this.controls) this.controls.dispose();
        if (this.model) this.disposeObject(this.model);
        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }
    }
}

// Card Preview Viewer (simplified, no controls, creates own geometry)
class CardPreviewViewer {
    constructor(container, modelType, color) {
        this.container = container;
        this.isDestroyed = false;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111427);

        const rect = container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const aspect = rect.width / rect.height;
        this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100);
        this.camera.position.set(2, 2, 4);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(rect.width, rect.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        container.appendChild(this.renderer.domElement);

        // Simple lighting
        this.scene.add(new THREE.AmbientLight(0x404060, 0.6));
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(3, 5, 3);
        this.scene.add(light);
        const fill = new THREE.DirectionalLight(0x6080ff, 0.3);
        fill.position.set(-3, 1, -3);
        this.scene.add(fill);

        // Create model directly using a dedicated builder (avoid the dispose issue)
        this._buildModel(modelType, color);

        this.animate();
    }

    _buildModel(modelType, color) {
        // Create a temporary hidden container for the ModelViewer
        const tempContainer = document.createElement('div');
        tempContainer.style.width = '1px';
        tempContainer.style.height = '1px';
        tempContainer.style.position = 'absolute';
        tempContainer.style.visibility = 'hidden';
        document.body.appendChild(tempContainer);

        const builder = new ModelViewer(tempContainer, {
            autoRotate: false,
            interactive: false
        });
        builder.loadModel(modelType, color);

        if (builder.model) {
            // Deep clone model with separate materials
            this.model = builder.model.clone();
            this.model.traverse(child => {
                if (child.isMesh && child.material) {
                    child.material = child.material.clone();
                }
            });
            this.scene.add(this.model);
        }

        // Now safely destroy — our cloned materials are independent
        builder.destroy();
        document.body.removeChild(tempContainer);
    }

    animate() {
        if (this.isDestroyed) return;
        requestAnimationFrame(() => this.animate());
        if (this.model) {
            this.model.rotation.y += 0.005;
        }
        if (this.renderer) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    destroy() {
        this.isDestroyed = true;
        if (this.model) {
            this.model.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }
    }
}

// STL Loader — parse binary/ASCII STL and return BufferGeometry
class SimpleSTLLoader {
    static parse(buffer) {
        const isBinary = SimpleSTLLoader._isBinary(buffer);
        return isBinary
            ? SimpleSTLLoader._parseBinary(buffer)
            : SimpleSTLLoader._parseASCII(buffer);
    }

    static _isBinary(buffer) {
        if (buffer.byteLength < 84) return false;
        const view = new DataView(buffer);
        const triCount = view.getUint32(80, true);
        const expected = 84 + triCount * 50;
        // Binary if size matches expected
        if (Math.abs(expected - buffer.byteLength) < 10) return true;
        // Also check if it starts with 'solid' (ASCII indicator)
        const header = new Uint8Array(buffer, 0, 5);
        const str = String.fromCharCode(...header);
        return str !== 'solid';
    }

    static _parseBinary(buffer) {
        const view = new DataView(buffer);
        const triCount = view.getUint32(80, true);
        const vertices = new Float32Array(triCount * 9);
        const normals = new Float32Array(triCount * 9);

        for (let i = 0; i < triCount; i++) {
            const offset = 84 + i * 50;
            const nx = view.getFloat32(offset, true);
            const ny = view.getFloat32(offset + 4, true);
            const nz = view.getFloat32(offset + 8, true);

            for (let j = 0; j < 3; j++) {
                const vOffset = offset + 12 + j * 12;
                const idx = i * 9 + j * 3;
                vertices[idx] = view.getFloat32(vOffset, true);
                vertices[idx + 1] = view.getFloat32(vOffset + 4, true);
                vertices[idx + 2] = view.getFloat32(vOffset + 8, true);
                normals[idx] = nx;
                normals[idx + 1] = ny;
                normals[idx + 2] = nz;
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        return geometry;
    }

    static _parseASCII(buffer) {
        const text = new TextDecoder().decode(buffer);
        const vertices = [];
        const normals = [];
        const normalRegex = /facet\s+normal\s+([\d.eE+-]+)\s+([\d.eE+-]+)\s+([\d.eE+-]+)/g;
        const vertexRegex = /vertex\s+([\d.eE+-]+)\s+([\d.eE+-]+)\s+([\d.eE+-]+)/g;

        let nm;
        const allNormals = [];
        while ((nm = normalRegex.exec(text)) !== null) {
            allNormals.push([parseFloat(nm[1]), parseFloat(nm[2]), parseFloat(nm[3])]);
        }

        let vm;
        let normalIdx = 0;
        let vCount = 0;
        while ((vm = vertexRegex.exec(text)) !== null) {
            vertices.push(parseFloat(vm[1]), parseFloat(vm[2]), parseFloat(vm[3]));
            const ni = Math.floor(vCount / 3);
            if (ni < allNormals.length) {
                normals.push(...allNormals[ni]);
            } else {
                normals.push(0, 0, 1);
            }
            vCount++;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        return geometry;
    }
}

window.ModelViewer = ModelViewer;
window.CardPreviewViewer = CardPreviewViewer;
window.SimpleSTLLoader = SimpleSTLLoader;
