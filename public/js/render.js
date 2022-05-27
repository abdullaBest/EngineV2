/*
    
    copyright 2019-2022 Hamzin Abdulla (abdulla_best@mail.ru)
*/

import { 

    WebGLRenderer, 

    Raycaster, 
    Vector3,
    Color,
    BasicShadowMap,
    PCFShadowMap,
    PCFSoftShadowMap,
    PerspectiveCamera,
    Scene,
    AudioListener,
    VSMShadowMap,
    FogExp2,
    Vector2,
    CubeTextureLoader,
    AmbientLight,
    DirectionalLight,
    AnimationMixer,

    VectorKeyframeTrack,
    QuaternionKeyframeTrack,
    SkinnedMesh,
    Mesh,
    Object3D,
    Bone,
    LinearFilter,
    NearestFilter,
    RGBAFormat,
    RGBFormat,
    WebGLRenderTarget,

    OrthographicCamera,
    ShaderMaterial,
    DoubleSide,
    BufferGeometry,
    BufferAttribute,
    Float32BufferAttribute,
    DepthTexture,
    DepthFormat,
    RedFormat,
    DepthStencilFormat,
	UnsignedShortType,
    UnsignedInt248Type,
    UnsignedIntType,
    UnsignedByteType,
    LuminanceFormat,

    ACESFilmicToneMapping,
    ReinhardToneMapping,
    CineonToneMapping,
    LinearToneMapping,
    NoToneMapping,
    sRGBEncoding,

    Sphere,
    SphereGeometry,
    MeshBasicMaterial,
    MeshStandardMaterial,
    RawShaderMaterial,
    BoxGeometry,
    Matrix4,
    FloatType,
    TextureLoader,
    RepeatWrapping,

    DefaultLoadingManager,
} from '/lib/three.js'
import { TransformControls } from '/lib/TransformControls.js'
//import { BasisTextureLoader } from '/lib/BasisTextureLoader.js'
import { GLTFLoader } from '/lib/GLTFLoader.js'
import { KTX2Loader } from '/lib/KTX2Loader.js'
import { MeshoptDecoder } from '/lib/meshopt_decoder.module.js'
import { DRACOLoader } from '/lib/DRACOLoader.js'

let WIDTH       = window.innerWidth
let HEIGHT      = window.innerHeight

let ambientLight = null
let directionalLight = null

const matrix_tree = new Uint8Array(16).fill(0)
const parent_tree = new Array(17).fill(null)
const bones_tree = []

let empty_func = ()=>{}

let main_render_before = empty_func
let main_render        = empty_func
let main_render_shadow = empty_func
let main_render_after  = empty_func

export const raycaster = new Raycaster()
export const mouse     = new Vector3()
export const position  = new Vector2()

const color = new Color()
const _a    = new Vector3()
const _b    = new Vector3()
const _c    = new Vector3()

let _program = null
let _uniforms = null

export const deg_to_rad = deg => deg*Math.PI/180
export const rad_to_deg = rad => rad*180/Math.PI

export const simpleMaterial = new MeshBasicMaterial()

const pass_geometry = new BufferGeometry()
pass_geometry.setAttribute('position', new BufferAttribute(new Float32Array([-1, -1, 0, -1, 1, 0, 1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]), 3))
pass_geometry.setAttribute('uv', new BufferAttribute(new Float32Array([0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1]), 2))

const screen_copy = new Mesh(pass_geometry, new ShaderMaterial({
    uniforms: {
        map     : { value: null },
    },
    vertexShader: [
        'varying vec2 vUv;',
        'void main() {',
            'vUv = uv;',
            'gl_Position = vec4(position,1.0);',
        '}'].join(''),
    fragmentShader: [
        'uniform sampler2D map;',
        'varying vec2 vUv;',
        //'const vec4 UnpackFactors = 1.0 / vec4(  256. * 256. * 256., 256. * 256., 256., 1. );',
        //'float unpackRGBAToDepth( const in vec4 v ) { return dot( v, UnpackFactors ); }',
        'void main(){',
            //'float depth = unpackRGBAToDepth(texture2D( map, vUv));',
			//'gl_FragColor = vec4(depth,depth,depth,1.0);',          
			'gl_FragColor = texture2D( map, vUv);',          
        '}'].join(''),
        side        : DoubleSide,
        depthTest   : false,
        depthWrite  : false,
        transparent : false,
}))

const renderResize=()=>{
    
    const dpr = renderer.getPixelRatio()

    WIDTH   = window.innerWidth*dpr
    HEIGHT  = window.innerHeight*dpr
    const aspect  = WIDTH/HEIGHT

    camera.aspect = aspect
    camera.updateProjectionMatrix()

    renderer.setSize( WIDTH, HEIGHT )

    rt1.setSize( WIDTH, HEIGHT )
}

export const get_MeshStandardMaterial = ()=> { return new MeshStandardMaterial() }
export const get_MeshBasicMaterial = ()=> { return new MeshBasicMaterial() }

export const fullscreen =()=>{
    if ( !document.fullscreenEnabled ) { return }
    if ( document.fullscreenElement ) {
        document.exitFullscreen()
    }else{
        document.body.requestFullscreen()
    }
}

const prepare_light =()=>{
    ambientLight = new AmbientLight( 0x8080a0, 0.5); // soft white light
    scene.add(ambientLight)

    directionalLight = new DirectionalLight(0xffffff, 1.0 )//0.4
    //directionalLight.rotation.x = RENDER.deg_to_rad(90)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 1
    directionalLight.shadow.camera.far = 1000
    //directionalLight.shadow.bias = 0.001

    //directionalLight.shadow.radius = 2    

    directionalLight.shadow.camera.left   = -150
    directionalLight.shadow.camera.right  =  150
    directionalLight.shadow.camera.top    = -150
    directionalLight.shadow.camera.bottom =  150

    scene.add(directionalLight)

    //let helper = new DirectionalLightHelper( directionalLight, 5 )
    //RENDER.scene.add( helper )
    //let helper2 = new CameraHelper( directionalLight.shadow.camera )
    //RENDER.scene.add( helper2 )
    //init_state()

    directionalLight.position.set(0, 250, 0)
    directionalLight.target.position.set(140,0,140)
    directionalLight.target.updateMatrixWorld()
  
}

export const update_matrix = (m)=>{
    m.matrixWorld.compose( m.position, m.quaternion, m.scale )

    if (m.isSkinnedMesh){
        //if ( m.bindMode === 'attached' ) {
			m.bindMatrixInverse.copy( m.matrixWorld ).invert()
        //} else if ( m.bindMode === 'detached' ) {
		//	m.bindMatrixInverse.copy( m.bindMatrix ).invert()
        //}
        m.skeleton.update()
    }

    let t = 0
    let p = 0
    let l = m.children
    do {
        while(p!==l.length){

            const o = l[p]

            o.matrix.compose( o.position, o.quaternion, o.scale )
            o.matrixWorld.multiplyMatrices( m.matrixWorld, o.matrix )
            if (o.isSkinnedMesh){
                //if ( o.bindMode === 'attached' ) {
                    o.bindMatrixInverse.copy( o.matrixWorld ).invert()
                //} else if ( m.bindMode === 'detached' ) {
        		//	o.bindMatrixInverse.copy( o.bindMatrix ).invert()
                //}
                o.skeleton.update()
            }
        
            p = p + 1
            if (o.children.length!==0 && t<matrix_tree.length){
                matrix_tree[t] = p
                m = o
                l = o.children
                p = 0
                t = t + 1
            }

        }

        if (t===0){
            break
        }
        m = m.parent
        l = m.children
        t = t - 1
        p = matrix_tree[t]

    }while (true)
}

export const render_mesh = (m)=>{

    if (m.isMesh || m.isSkinnedMesh || m.isLine) {
        if ( renderer.abd_frustum(m) ){
            renderer.abd_render_obj ( m, scene, camera, m.material )
        }
    }
    let t = 0
    let p = 0
    let l = m.children
    do {
        while(p!==l.length){

            const o = l[p]
            if (o.isMesh || o.isSkinnedMesh || o.isLine) {
                if ( renderer.abd_frustum(o) ){
                    renderer.abd_render_obj ( o, scene, camera, o.material )
                }
            }
        
            p = p + 1
            if (o.children.length!==0 && t<matrix_tree.length){
                matrix_tree[t] = p
                m = o
                l = o.children
                p = 0
                t = t + 1
            }

        }

        if (t===0){
            break
        }
        m = m.parent
        l = m.children
        t = t - 1
        p = matrix_tree[t]

    }while (true)
}

export const render_mesh_shadow = (m)=>{

    if (m.isMesh || m.isSkinnedMesh) {
        renderer.abd_renderShadow( m )
    }
    let t = 0
    let p = 0
    let l = m.children
    do {
        while(p!==l.length){

            const o = l[p]
            if (o.isMesh || o.isSkinnedMesh) {
                renderer.abd_renderShadow( o )
            }
        
            p = p + 1
            if (o.children.length!==0 && t<matrix_tree.length){
                matrix_tree[t] = p
                m = o
                l = o.children
                p = 0
                t = t + 1
            }

        }

        if (t===0){
            break
        }
        m = m.parent
        l = m.children
        t = t - 1
        p = matrix_tree[t]

    }while (true)
}


export const render_mesh_no_frustum = (m)=>{

    if (m.isMesh || m.isSkinnedMesh) {
        if ( renderer.abd_frustum(m) ){
            const p = renderer.abd_prepareObject( m, scene, camera, m.material )
            renderer.abd_renderObject( m, m.geometry, m.material, p )
        }
    }
    let t = 0
    let p = 0
    let l = m.children
    do {
        while(p!==l.length){

            const o = l[p]
            if (o.isMesh || o.isSkinnedMesh) {
                //if ( renderer.abd_frustum(o) ){
                    const p = renderer.abd_prepareObject( o, scene, camera, o.material )
                    renderer.abd_renderObject( o, o.geometry, o.material, p )
                //}
            }
        
            p = p + 1
            if (o.children.length!==0 && t<matrix_tree.length){
                matrix_tree[t] = p
                m = o
                l = o.children
                p = 0
                t = t + 1
            }

        }

        if (t===0){
            break
        }
        m = m.parent
        l = m.children
        t = t - 1
        p = matrix_tree[t]

    }while (true)
}

export const render_vox = (m)=>{
    const p = renderer.abd_prepareObject( m, scene, camera, m.material )
    let u = p.getUniforms()
    renderer.abd_setValue(u,'tBigmap', LAND.getMinimapTexture())
    renderer.abd_setValue(u,'size', 6.0)
    renderer.abd_setValue(u,'fogColor', scene.fog.color)
    renderer.abd_setValue(u,'fogDensity', scene.fog.density)
    renderer.abd_setValue(u,'sunDir', sunDir)
    renderer.abd_setValue(u,'sunColor', directionalLight.color)
    renderer.abd_setValue(u,'ambColor', ambientLight.color)

    renderer.abd_setValue(u,'scale', renderTarget.height*0.5)

    renderer.abd_renderObject( m, m.geometry, m.material, p )

}

export const traverse_find_by_name = (m,name)=>{
    let t = 0
    let p = 0
    let l = m.children
    if (m.name===name){
        return m
    }
    do {
        while(p!==l.length){

            const o = l[p]

            if (o.name===name){
                return o
            }
        
            p = p + 1
            if (o.children.length!==0 && t<matrix_tree.length){
                matrix_tree[t] = p
                m = o
                l = o.children
                p = 0
                t = t + 1
            }

        }

        if (t===0){
            break
        }
        m = m.parent
        l = m.children
        t = t - 1
        p = matrix_tree[t]

    }while (true)
    
    return null
}

export const traverse = (m,callback)=>{
    let t = 0
    let p = 0
    let l = m.children
    callback(m)
    do {
        while(p!==l.length){

            const o = l[p]

            callback(o)
        
            p = p + 1
            if (o.children.length!==0 && t<matrix_tree.length){
                matrix_tree[t] = p
                m = o
                l = o.children
                p = 0
                t = t + 1
            }

        }

        if (t===0){
            break
        }
        m = m.parent
        l = m.children
        t = t - 1
        p = matrix_tree[t]

    }while (true)
}

export const traverse_visible = (m,callback)=>{
    if (m.visible===false){
        return
    }
    let t = 0
    let p = 0
    let l = m.children
    do {
        while(p!==l.length){

            const o = l[p]

            p = p + 1

            if (o.visible===true){
                callback(o)
                if (o.children.length!==0 && t<matrix_tree.length){
                    matrix_tree[t] = p
                    m = o
                    l = o.children
                    p = 0
                    t = t + 1
                }
            }
        }

        if (t===0){
            break
        }
        m = m.parent
        l = m.children
        t = t - 1
        p = matrix_tree[t]

    }while (true)
}
// Кости
export const clone_bones = (source)=>{

    let m = source
    const g = new Object3D()
    g.name = source.name
    g.position.copy(source.position)
    g.rotation.copy(source.rotation)
    g.scale.copy(source.scale)
    parent_tree[0] = g

    let t = 0
    let p = 0
    let l = m.children
    do {
        while(p!==l.length){

            const o = l[p]

            if (o.isMesh || o.isSkinnedMesh){
                p = p + 1
                continue
            }

            let b
            if (o.isBone){
                b = new Bone()
            }else{
                b = new Object3D()
            }
            b.name = o.name
            b.position.copy(o.position)
            b.rotation.copy(o.rotation)
            b.scale.copy(o.scale)
            parent_tree[t].add(b)
            bones_tree.push(b)
        
            p = p + 1
            if (o.children.length!==0 && t<matrix_tree.length){
                matrix_tree[t] = p
                m = o
                l = o.children
                p = 0
                t = t + 1
                parent_tree[t] = b
            }

        }

        if (t===0){
            break
        }
        m = m.parent
        l = m.children
        t = t - 1
        p = matrix_tree[t]

    }while (true)

    return g
}

export const clone_mesh = (group,o,attach_bone)=>{
    const a = o.clone(true)
    if (o.isSkinnedMesh){
        a.skeleton = o.skeleton.clone()
        a.bindMatrix.copy( o.bindMatrix )
        for (let i=0;i<a.skeleton.bones.length;i++){
            let b = a.skeleton.bones[i]
            let bb = bones_tree.find(e=>e.name===b.name)
            a.skeleton.bones[i] = bb
            if (!bb){
                console.error('не возможной найти кость',b,'клонирование не возможно')
            }
        }
        a.bind( a.skeleton, a.bindMatrix )
    }
    /*
    let name = attach_bone
    if (name===''){
        const m = o.parent
        name = m.name
    }
    
    const bb = bones_tree.find(e=>e.name===name)
    if (bb){
        bb.add(a)
    }else{
        group.add(a)
    }
    */
    group.add(a)
    return a
}

export const clear_clone_arrays = ()=>{
    parent_tree.fill(null)
    bones_tree.length = 0
}
//

export const new_mixer = (obj)=>{
    return new AnimationMixer( obj )
}


const dot = ( a,b )=> a[0]*b[0] + a[1]*b[1] + a[2]*b[2]

const crossVectors = ( r, a, b )=>{
    r[0] = a[1] * b[2] - a[2] * b[1]
    r[1] = a[2] * b[0] - a[0] * b[2]
    r[2] = a[0] * b[1] - a[1] * b[0]
}

const cross = ( a,b )=>a[0]*b[1] - a[1]*b[0]

export const intersectTriangle = ( origin, direction, a, b, c, backfaceCulling, target )=>{

    // Compute the offset origin, edges, and normal.

    // from https://github.com/pmjoniak/GeometricTools/blob/master/GTEngine/Include/Mathematics/GteIntrRay3Triangle3.h

    const _edge1    = [0,0,0]
    const _edge2    = [0,0,0]
    const _edge3    = [0,0,0]
    const _normal$1 = [0,0,0]
    const _diff     = [0,0,0]

    _edge1[0] = b[0] - a[0]
    _edge1[1] = b[1] - a[1]
    _edge1[2] = b[2] - a[2]

    _edge2[0] = c[0] - a[0]
    _edge2[1] = c[1] - a[1]
    _edge2[2] = c[2] - a[2]

    crossVectors( _normal$1, _edge1, _edge2 )

    // Solve Q + t*D = b1*E1 + b2*E2 (Q = kDiff, D = ray direction,
    // E1 = kEdge1, E2 = kEdge2, N = Cross(E1,E2)) by
    //   |Dot(D,N)|*b1 = sign(Dot(D,N))*Dot(D,Cross(Q,E2))
    //   |Dot(D,N)|*b2 = sign(Dot(D,N))*Dot(D,Cross(E1,Q))
    //   |Dot(D,N)|*t = -sign(Dot(D,N))*Dot(Q,N)
    let DdN = dot( direction, _normal$1 )
    let sign;

    if ( DdN > 0 ) {

        if ( backfaceCulling ) return null
        sign = 1

    } else if ( DdN < 0 ) {
        sign = - 1
        DdN = - DdN
    } else {
        return null
    }

    _diff[0] = origin[0] - a[0]
    _diff[1] = origin[1] - a[1]
    _diff[2] = origin[2] - a[2]
    crossVectors( _edge3, _diff, _edge2 ) 
    const DdQxE2 = sign * dot( direction, _edge3)

    // b1 < 0, no intersection
    if ( DdQxE2 < 0 ) {
        return null
    }

    crossVectors( _edge3, _edge1, _diff ) 
    const DdE1xQ = sign * dot( direction, _edge3)

    // b2 < 0, no intersection
    if ( DdE1xQ < 0 ) {
        return null
    }

    // b1+b2 > 1, no intersection
    if ( DdQxE2 + DdE1xQ > DdN ) {
        return null
    }

    // Line intersects triangle, check if ray does.
    const QdN = - sign * dot( _diff,_normal$1 )

    // t < 0, no intersection
    if ( QdN < 0 ) {
        return null
    }

    // Ray intersects triangle.
    //return target.copy( direction ).multiplyScalar(QdN / DdN).add( origin )
    let distance = QdN / DdN
    _edge3[0] = origin.x + direction.x*distance
    _edge3[1] = origin.y + direction.y*distance
    _edge3[2] = origin.z + direction.z*distance
    return _edge3
}

export const ray_vs_triangle = (a,b,c)=>{
    /*
        raycaster.ray.origin.x = o[0]
        raycaster.ray.origin.y = o[1]
        raycaster.ray.origin.z = o[2]
        raycaster.ray.direction.x = d[0]
        raycaster.ray.direction.y = d[1]
        raycaster.ray.direction.z = d[2]
    */
        _a.x = a[0]
        _a.y = a[1]
        _a.z = a[2]
        _b.x = b[0]
        _b.y = b[1]
        _b.z = b[2]
        _c.x = c[0]
        _c.y = c[1]
        _c.z = c[2]
        return raycaster.ray.intersectTriangle(_a,_b,_c,false,mouse)
    }

export const targetCreate = (width,height)=>{
    const t = new WebGLRenderTarget(
        width, height,
        {
            minFilter    : LinearFilter,  //NearestFilter, //LinearFilter,
            magFilter    : NearestFilter, //NearestFilter, //LinearFilter,
            format       : RGBAFormat,
            depthBuffer  : false,
            stencilBuffer: false
        }
    )

    return t
}

export const targetFloatCreate = (width,height)=>{
    const t = new WebGLRenderTarget(
        width, height,
        {
            minFilter    : LinearFilter,  //NearestFilter, //LinearFilter,
            magFilter    : LinearFilter,  //NearestFilter, //LinearFilter,
            format       : RedFormat,
            type         : FloatType, //UnsignedShortType, //UnsignedIntType, //FloatType,
            depthBuffer  : false,
            stencilBuffer: false
        }
    )
    t.texture.internalFormat = 'R32F'
    return t
}

export const get_target_pixels = (t)=>{
    const _data = new Uint8Array(t.width*t.height*4)
    renderer.readRenderTargetPixels ( t, 0, 0, t.width, t.height, _data)
    return _data
}

export const get_target_floats = (t)=>{
    const _data = new Float32Array(t.width*t.height)
    renderer.readRenderTargetPixels ( t, 0, 0, t.width, t.height, _data)
    return _data
}

export const target_to_cavas = (t)=>{
    const _data = new Uint8Array(t.width*t.height*4)
    renderer.readRenderTargetPixels ( t, 0, 0, t.width, t.height, _data)


    let canvas = document.createElement('canvas')
    canvas.width = t.width
    canvas.height = t.height
    let ctx = canvas.getContext('2d')
    let imgData = ctx.createImageData(t.width,t.height)
    let data = imgData.data

    // copy img byte-per-byte into our ImageData
    for (let i = 0; i<data.length; i++) {
        data[i] = _data[i]
    }
    ctx.putImageData(imgData, 0, 0)
    canvas.style.position = 'absolute'
    canvas.style.left = '0'
    canvas.style.top = '0'
    canvas.style.zIndex = '1000'
    canvas.style.width = t.width+'px'
    canvas.style.height = t.height+'px'
    return canvas
    //document.body.appendChild(canvas)

}

export const target_copy = (source,dest)=>{
    _renderStart(dest)
    _setProgram( screen_copy )
    _setValue('map', source.texture)
    _renderObject( screen_copy)
    _renderEnd()
}

export const target_to_cavas_part = (t,x,y,w,h)=>{
    const _data = new Uint8Array(w*h*4)
    renderer.readRenderTargetPixels ( t, x, y, w, h, _data)

    let canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    let ctx = canvas.getContext('2d')
    let imgData = ctx.createImageData(w,h)
    let data = imgData.data

    // copy img byte-per-byte into our ImageData
    for (let i = 0; i<data.length; i++) {
        data[i] = _data[i]
    }
    ctx.putImageData(imgData, 0, 0)
    return canvas

}

export const target_fill = (t,r,g,b)=>{
    color.r = r
    color.g = g
    color.b = b
    renderer.setClearColor(color)

    renderer.setRenderTarget(t)
    renderer.clear()
    
    //RENDER.renderer.render(empty_scene, main_layer_camera)

    color.r = 0
    color.g = 0
    color.b = 0
    //renderer.setRenderTarget(null)
    renderer.setClearColor(color)
}

export const group_to_scene = (a)=>{
    let s = new Scene()
    s.name = a.name
    s.position.copy(a.position)
    s.rotation.copy(a.rotation)
    s.scale.copy(a.scale)

    s.matrix.copy( a.matrix )
    s.matrixWorld.copy( a.matrixWorld )

    s.children = a.children
    return s
}

// Определяет положение указателя экрана на поверхности (y=0)
export const mouse_over_grid = (x,y)=>{
    mouse.x = x
    mouse.y = y
    mouse.z = 0.0
    raycaster.setFromCamera( mouse, camera )
    const r = raycaster.ray
    
    //      *
    //     /
    //    /
    // --*---
    const d = r.origin.y/r.direction.y
    //let y = r.origin.y - r.direction.y*d

    mouse.x = r.origin.x - r.direction.x*d
    mouse.y = r.origin.z - r.direction.z*d
}

export const _renderStart = (target)=>{
    renderer.setRenderTarget( target )
    //renderer.setClearColor(color, 1)
    //renderer.clear(true,true,true)
    renderer.abd_render_start(empty_scene,orto_camera)
}

export const _setProgram = (m)=>{
    _program = renderer.abd_prepareObject( m, empty_scene, orto_camera, m.material )
    _uniforms = _program.getUniforms()
}

export const setProgram = (m)=>{
    _program = renderer.abd_prepareObject( m, scene, camera, m.material )
    _uniforms = _program.getUniforms()
}


export const _setValue = (name,value)=>{
    renderer.abd_setValue( _uniforms, name, value )
}

export const _renderObject = (m)=>{
    renderer.abd_renderObject( m, m.geometry, m.material, _program )
}

export const _renderEnd = ()=>{
    renderer.abd_render_end()
}

// Подготовка рендера
const canvas = document.getElementById('CANVAS')
canvas.style.width  = '100vw'
canvas.style.height = '100vh'
export const renderer = new WebGLRenderer({
    canvas    : canvas, 
    antialias : false, 
    alpha     : false,
    //stencil   : false,
    precision : 'lowp',  //mediump
    //powerPreference: 'high-performance', // глючит на некоторых десктоп устройствах
    //premultipliedAlpha   : true,
    //preserveDrawingBuffer: true, 
    /*logarithmicDepthBuffer:true,*/ 
}) 


console.log('PixelRatio',renderer.getPixelRatio())
console.log('webgl2',renderer.capabilities.isWebGL2)
console.log('WEBGL_depth_texture',renderer.extensions.has( 'WEBGL_depth_texture' ))

if (!renderer.capabilities.isWebGL2){
    alert('webgl2')
}

renderer.autoClear = false
renderer.physicallyCorrectLights = false
renderer.sortObjects = false 
renderer.shadowMap.enabled = false
renderer.shadowMap.type = BasicShadowMap //PCFSoftShadowMap PCFShadowMap BasicShadowMap VSMShadowMap

//----------------------------------------
const rt1 = new WebGLRenderTarget( 
    WIDTH, HEIGHT,
    {
        minFilter     : NearestFilter,
        magFilter     : NearestFilter,
        format        : RGBAFormat,
        depthBuffer   : true,
        stencilBuffer : false
    }
)
rt1.samples = 4

rt1.texture.generateMipmaps = false
rt1.depthTexture            = new DepthTexture()
rt1.depthTexture.format     = DepthFormat
rt1.depthTexture.type       = FloatType //UnsignedIntType //FloatType
//----------------------------------------

export const camera     = new PerspectiveCamera( 45, WIDTH/HEIGHT, 2, 8192 )
//export const camera   = new OrthographicCamera( -4096, 4096, -4096, 4096, 0.1, 8192 )
const orto_camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
orto_camera.position.z    = 0

export const scene    = new Scene()
let empty_scene       = new Scene()
scene.fog = new FogExp2( 0x9696a6, 0.000003 ) 

export const listener = new AudioListener()

export const transformControls = new TransformControls(camera,canvas)

// ---------------------
// Обновляет размеры канвы при изменении размеров окна браузера
window.addEventListener('resize', renderResize)
//
let lastframe_time = performance.now()
let animframeID = 0
//
export const textureloader = new TextureLoader()
export const ktx2loader = new KTX2Loader()
    .setTranscoderPath( '/lib/basis/' )
    .detectSupport( renderer )

const draco = new DRACOLoader()
    .setDecoderPath( '/lib/draco/gltf/' )

export const gltfloader = new GLTFLoader()
    .setKTX2Loader( ktx2loader )
    .setMeshoptDecoder( MeshoptDecoder )
    .setDRACOLoader( draco )

//
renderResize()

prepare_light()

const geometry = new BoxGeometry( 1, 1, 1 )
const material = new MeshBasicMaterial( {color: 0x00ff00} )
export const cube = new Mesh( geometry, material )
scene.add( cube )

export const make_screen_shoot = (width,height)=>{

    let ww = HEIGHT*0.60

    let x = Math.trunc(WIDTH/2 - ww/2)
    let y = Math.trunc(HEIGHT/2 - ww/2)
    let w = Math.trunc(ww)
    let h = Math.trunc(ww)

    const c = target_to_cavas_part(rt1, x,y,w,h)
    
    const canvas  = document.createElement('canvas')
    canvas.width  = width
    canvas.height = height
    const ctx     = canvas.getContext('2d')
    ctx.scale(1,-1)
    ctx.drawImage(c,0,0,width, -height)

    let d = ctx.getImageData(0,0,width,height) 

    return d.data
} 

export const prepare = (_render_before, _render_shadow, _render, _render_after)=>{
    main_render_before = _render_before
    main_render        = _render
    main_render_shadow = _render_shadow
    main_render_after  = _render_after
    
    /*
    DefaultLoadingManager.onStart = ( url, itemsLoaded, itemsTotal )=>{
    	console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' )
    }

    DefaultLoadingManager.onLoad = ( )=>{
    	console.log( 'Loading complete!')
    }

    DefaultLoadingManager.onProgress = ( url, itemsLoaded, itemsTotal )=>{
	    console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' )
    }

    DefaultLoadingManager.onError = ( url )=>{
    	console.log( 'There was an error loading ' + url )
    }
    */
}

export const classic_render = ()=>{
    const d = performance.now()
    const delta = d - lastframe_time
    //
    //if ( delta>23 ){
        lastframe_time = d
        
        //for ( let i = 0; i < mixers.length; i++ ) {
        //	mixers[ i ].update( delta*0.001 );
		//}
        main_render_before(delta)

        color.r = 0.1
        color.g = 0.1
        color.b = 0.1

        renderer.setRenderTarget( rt1 )
        renderer.setClearColor(color, 1)
        renderer.clear(true,true,true)
        
        // подготовка
        renderer.abd_render_start(scene,camera)

        main_render_shadow(delta)

/*
        // рендерим сцену
        renderer.setRenderTarget( renderTarget )// renderTarget
		renderer.clear(false,true,true)
        renderer.abd_render_start2(scene,camera,renderTarget)
 */       
  
        main_render(delta)
        //_render_quad()

        //update_matrix(scene)
        //render_mesh(scene)

        renderer.abd_render_end()

        //--------------------------------
        renderer.setRenderTarget( null )
        screen_copy.material.uniforms.map.value = rt1.texture
        renderer.render( screen_copy, orto_camera )
        //--------------------------------
     
        main_render_after()
        
    //}
    animframeID = requestAnimationFrame(classic_render)
}
