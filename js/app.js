import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
// import { GLTFLoader } from 'js/GLTFLoader.js';
import t from '../assets/2.jpg';
import t1 from '../assets/1.jpg';

import fragment from './shader/fragment.glsl';
import vertex from './shader/vertex.glsl';
import * as dat from 'dat.gui';
import gsap from 'gsap';

export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();
    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.physicallyCorrectLights = true;
    // NOTE: sRGB encoding not needed using Postprocessing-EffectComp-bloom***
    // this.renderer.outputEncoding = THREE.sRGBEncoding;
    
    // not sure if needed here
    // this.container = document.getElementById("container");
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70, 
      window.innerWidth / window.innerHeight, 
      0.001, 
      5000
    );

    // let frustumSize = 1;
    // let aspect = window.innerWidth / window.innerHeight;
    // this.camera = new THREE.OrthographicCamera(
    //   frustumSize / -2, frustumSize / 2, frustumSize / 2, frustumSize / -2, -1000, 1000
    // );
    this.camera.position.set(0, 0, 1500);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.video = document.getElementById('video1');

    this.video.addEventListener('ended', () => {
      gsap.to(this.video, {
        duration: 0.1,
        opacity: 0
      })
      gsap.to(this.material.uniforms.distortion, {
        duration: 2,
        value: 3,
        ease: 'power2.inOut'
      })
      // animate texture back to t1
      // gsap.to(this.material.uniforms.progress, {
      //   duration: 1, 
      //   delay: 0.5,
      //   value: 1
      // })
      gsap.to(this.bloomPass, {
        duration: 2,
        strength: 7,
        ease: 'power2.in'
      })
      gsap.to(this.material.uniforms.distortion, {
        duration: 2,
        value: 0,
        delay: 2,
        ease: 'power2.inOut'
      })
      gsap.to(this.bloomPass, {
        duration: 2,
        strength: 0,
        delay: 2,
        ease: 'power2.out',
        onComplete: () => {
          this.video.currentTime = 0;
          this.video.play();
          gsap.to(this.video, {
            duration: 0.1,
            opacity: 1
          })
        }
      })
    });

    this.isPlaying = true;

    this.addPost();
    this.addObjects();
    this.resize();
    this.render();
    this.setupResize();
    this.settings();
  }

  addPost() {
    this.renderScene = new RenderPass( this.scene, this.camera );
    this.bloomPass = new UnrealBloomPass( new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85 );
		this.bloomPass.threshold = this.settings.bloomThreshold;
		this.bloomPass.strength = this.settings.bloomStrength;
		this.bloomPass.radius = this.settings.bloomRadius;

		this.composer = new EffectComposer(this.renderer);
		this.composer.addPass(this.renderScene);
		this.composer.addPass(this.bloomPass);
  } 

  settings() {
    let that = this;
    this.settings = {
      distortion: 0,
      bloomStrength: 0,
    };
    this.gui = new dat.GUI();
    this.gui.add(this.settings, 'distortion', 0, 3, 0.01);
    this.gui.add(this.settings, 'bloomStrength', 0, 10, 0.01);
  }

  setupResize() {
    window.addEventListener('resize', this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.composer.setSize(this.width, this.height);

    //image convert
    // this.imageAspect = 2592/3872;
    // let a1;
    // let a2;
    // if(this.height/this.width>this.imageAspect) {
    //   a1 = (this.width/this.height) * this.imageAspect;
    //   a2 = 1;
    // } else {
    //   a1 = 1;
    //   a2 = (this.height/this.width) / this.imageAspect;
    // }
    
    // this.material.uniforms.resolution.value.x = this.width;
    // this.material.uniforms.resolution.value.y = this.height;
    // this.material.uniforms.resolution.value.z = a1;
    // this.material.uniforms.resolution.value.w = a2;

    // this.camera.fov =
    //   2 *
    //   Math.atan(this.width / this.camera.aspect / (2 * this.cameraDistance)) *
    //   (180 / Math.PI); // in degrees

    this.camera.updateProjectionMatrix();
  }

  addObjects() {
    let that = this;
    
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        progress: { value: 0 },
        distortion: { value: 0 },
        // texture1: { value: null },
        // t1: { value: new THREE.TextureLoader().load(texture1) },
        t: { value: new THREE.TextureLoader().load(t) },
        t1: { value: new THREE.TextureLoader().load(t1) },
        resolution: { value: new THREE.Vector4() },
      },
      // wireframe: true,
      // transparent: true,
      vertexShader: vertex,
      fragmentShader: fragment
    });
    this.geometry = new THREE.PlaneBufferGeometry(480*1.739, 820*1.739, 480, 820);

    this.plane = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.plane);
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if (!this.isPlaying) {
      this.render()
      this.isPlaying = true;
    }
  }

  render() {
    if (!this.isPlaying) return;
    this.time += 0.05;
    this.material.uniforms.time.value = this.time;
    // this.material.uniforms.distortion.value = this.settings.distortion;
    // this.bloomPass.strength = this.settings.bloomStrength;
    requestAnimationFrame(this.render.bind(this));
    // this.renderer.render(this.scene, this.camera);
    this.composer.render();
  }
}

new Sketch({
  dom: document.getElementById('container')
});