/*
    
    copyright 2019-2022 Hamzin Abdulla (abdulla_best@mail.ru)
*/
import { 
    ktx2loader, 
    textureloader, 
    gltfloader, 
    traverse, 
    get_MeshStandardMaterial, 
    get_MeshBasicMaterial, 
} from '/js/render.js'
import { DoubleSide, FrontSide, RepeatWrapping, LinearFilter, NearestFilter, Texture, LinearEncoding, UVMapping, CubeUVReflectionMapping } from '/lib/three.js'

let textures = []
let models   = []
let scripts  = []
let scripts_func = {}
const masks  = new Array(16).fill(null)    // маски

const _assets_by_name = new Map()

let requestCount  = 0
let callback_flag = 0
let manager_callback = ()=>{}
const emptyTexture = new Texture()

export const set_callback_flag   = (f)=>{ callback_flag = callback_flag | f }
export const check_callback_flag = (f)=>{ callback_flag & f }
export const setCallback         = (f)=>{ manager_callback = f }
export const getEmptyTexture     = ()=>emptyTexture

const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor

const set_texture_params = (t)=>{
    t.anisotropy = 4
    t.wrapS      = RepeatWrapping
    t.wrapT      = RepeatWrapping
    t.encoding   = LinearEncoding 

    if (t.name!==''){
        const a = textures[t.name]
        //
        if (!t.isCompressedTexture){
            t.generateMipmaps = a.mipmap
        }
        //
        if (a.mapping===0){
            t.mapping = UVMapping
        }else{
            t.mapping = CubeUVReflectionMapping
        }
    }
    
    update_requests_count()
}

const update_requests_count = ()=>{
    requestCount = requestCount - 1
    if (requestCount===0){
        manager_callback(callback_flag)
        callback_flag = 0
    }
}

export const load_texture_by_name = (name,url,flag)=>{
    requestCount = requestCount + 1
    callback_flag = callback_flag | flag
    
    const t = textureloader.load(
        url,
        set_texture_params,
        progress=>{},
        err=>console.error(err)
    )
    _assets_by_name.set(name,t)
}

export const load_image_by_name = (name,url,flag)=>{
    requestCount = requestCount + 1
    callback_flag = callback_flag | flag
    
    const image = new Image()
    image.onload = update_requests_count
    image.src = url

    _assets_by_name.set(name,image)
}

export const get_by_name = (name)=>_assets_by_name.get(name)
export const delete_by_name = (name)=>_assets_by_name.delete(name)

export const load_model = (n,callback)=>{
    const a = models[n]
    if (!a){
        return
    }
    if (a.g!==null){
        callback(a)
        return
    }
    
    gltfloader.load('/m/'+a.n+'.g',g=>{
        a.g = g
        callback(a)
    },(xhr)=>{
    },(err)=>{
        alert(err)
    })
}

export const get_texture = (n)=>{
    const a = textures[n]
    if (a.t===null){
        const u = '/t/'+a.n+'.k'
        if ( a.type===2 ){
            a.t = textureloader.load(u,set_texture_params)
        }else{
            a.t = ktx2loader.load(u,set_texture_params)
        }
        a.t.name = a.n
        //
        requestCount = requestCount + 1
    }
    return a.t
}

export const loadModel = (n)=>{
    const model = models[n]
    if (model===undefined){
        return
    }
    if (model.g===null){
        requestCount = requestCount + 1
        gltfloader.load('/m/'+model.n+'.g',g=>{
            model.g = g
            prepare_materials(model)
            update_requests_count()
        },xhr=>{
        },err=>{
            console.log(err)
        })

        // загружаем текстуры
        for (let name in model.m){
            const m = model.m[name]
            get_texture(m.defuse)
            get_texture(m.normals)
            get_texture(m.arm)
        }
    }
}

export const getModel = n=>models[n]

export const set_assets_flag = (flag)=>{
    callback_flag = callback_flag | flag
    if (requestCount===0){
        manager_callback(callback_flag)
        callback_flag = 0
    }
}

export const get_texture_from_file = (file,callback)=>textureloader.load(URL.createObjectURL( file ),callback)

export const prepare_material = (materials,obj)=>{
    const material = materials[obj.name]
    if (material===undefined){
        return
    }
    let m = null
    switch(material.type){
        case 'MeshStandardMaterial':{ // MeshStandardMaterial
            m = get_MeshStandardMaterial()

            m.map          = get_texture(material.defuse)
            if (material.normals!==0){
                m.normalMap = get_texture(material.normals)
            }
            if (material.arm!==0){
                m.aoMap        = get_texture(material.arm)
                m.roughnessMap = m.aoMap
                m.metalnessMap = m.aoMap
            }
            if (material.env!==0){
                m.envMap = get_texture(material.env)
            }

            m.roughness    = material.roughness
            m.metalness    = material.metalness

            m.alphaTest    = material.alphatest
            m.side         = material.dside?DoubleSide:FrontSide
            m.transparent  = material.transparent
        }
        break;
        default:{    // MeshBasicMaterial
            m = get_MeshBasicMaterial()

            m.map = get_texture(material.defuse)

            m.alphaTest   = material.alphatest
            m.side        = material.dside?DoubleSide:FrontSide
            m.transparent = material.transparent
        }
    }
    obj.material = m
}

const prepare_materials = (model)=>traverse(model.g.scene, obj => prepare_material(model.m,obj) )    

export const prepare_materials_for_scene = (materials,scene)=>traverse(scene, obj => prepare_material(materials,obj) )    


export const get_model = (n,callback)=>{
    const model = models[n]
    if (model===undefined){
        return
    }
    if (model.g!==null){
        prepare_materials(model)
        callback(model)
    }else{
        gltfloader.load('/m/'+model.n+'.g',g=>{
            model.g = g
            prepare_materials(model)
            callback(model)
        },xhr=>{
        },err=>{
            console.log(err)
        })
    }
}

export const script_exists = (name)=>{
    if (scripts.indexOf(name)!==-1){
        return true
    }
    return false
}

export const get_script = (name,callback)=>{
    fetch('s/'+name+'.js?'+Date.now())
    .then(r => r.text())
    .then(txt => {
        const f = new Function('params','callback',txt)
        scripts_func[name] = f
        callback(f)
    })
}

export const getMask = n => masks[n]
export const getMasksCount = () => masks.length

export const prepareEditor = (_textures,_models,_scripts)=>{
    textures = _textures
    models   = _models
    scripts  = _scripts

    for (let i=0;i<scripts.length;i++){
        const name = scripts[i]
        const type = name.split('_')
        if (type[0]==='models'){
            const opt = document.createElement('option')
            opt.value = name
            $.generator_scripts.el.appendChild(opt)
        }
    }
}


export const prepare = new Promise((resolve,reject)=>{
    let c = masks.length - 1
    const check = ()=>{
        c = c - 1
        if (c===0){
            resolve()
        }
    }
    // загружаем маски
    const count = masks.length
    for (let i=1; i<count; i++) {
        const t = textureloader.load('/t/masks/'+i+'.png', check)

        t.generateMipmaps = false
        t.magFilter       = LinearFilter   //NearestFilter LinearFilter
        t.minFilter       = NearestFilter  
        t.anisotropy      = 1
        t.wrapS           = RepeatWrapping
        t.wrapT           = RepeatWrapping
        t.mapping         = UVMapping

        masks[i] = t
    }
})
