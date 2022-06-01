/*
    
    copyright 2019-2022 Hamzin Abdulla (abdulla_best@mail.ru)
*/
import * as child_process from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import PNG from 'pngjs'
import * as INFO from './public/js/info.mjs'
import * as USER from './user.mjs'

let textures = null
let models   = null
let _games   = null
let games    = []

export let mode   = 0      //
let n        = 0    //
let width    = 0    //
let height   = 0
let texture_data = null
let model_data = null


export const init = (user)=>{
    USER.send_str(user,JSON.stringify({
        i : INFO.MSG_EDITOR_INIT,
        t : textures,
        m : models,
        g : _games,
    }))
}

// ------------------------------------
//  Работа с текстурами
// ------------------------------------
export const texture_set = (data)=>{
    texture_data = data
    if (texture_data.group===''){
        texture_data.group = 'root'
    }
    mode = 1
}

const writeToFile = (img_png,filePath)=>{
    return new Promise((resolve, reject) => {
        img_png.pack().pipe(fs.createWriteStream(filePath))
        .on('finish', resolve)
        .on('error', reject)
    })
}

export const save_texture_original =(message)=>{
    let png_mode = 2
    if (texture_data.alpha===true){
        png_mode = 6
    }
    let img_png = new PNG.PNG({width: texture_data.o_width, height: texture_data.o_height, colorType:png_mode})  
    let b = Buffer.from(message)
    let i = 0
    for (var y = 0; y < img_png.height; y++) {
        for (var x = 0; x < img_png.width; x++) {
            var idx = (img_png.width * y + x) << 2;
            img_png.data[idx + 0] = b[i+0]
            img_png.data[idx + 1] = b[i+1]
            img_png.data[idx + 2] = b[i+2]
            img_png.data[idx + 3] = b[i+3]
            i=i+4
        }
    }

    mode = mode + 1

    writeToFile(img_png,path.resolve('./public/t/original/'+texture_data.n+'.png')).then(()=>{
        console.log('texture original:',texture_data.n)
    })
}


export const save_texture_resized =(user,message)=>{
    let png_mode = 2
    if (texture_data.alpha===true){
        png_mode = 6
    }
    let img_png = new PNG.PNG({width: texture_data.width, height: texture_data.height, colorType:png_mode})  
    let b = Buffer.from(message)
    let i = 0
    for (var y = 0; y < img_png.height; y++) {
        for (var x = 0; x < img_png.width; x++) {
            var idx = (img_png.width * y + x) << 2;
            img_png.data[idx + 0] = b[i+0]
            img_png.data[idx + 1] = b[i+1]
            img_png.data[idx + 2] = b[i+2]
            img_png.data[idx + 3] = b[i+3]
            i=i+4
        }
    }

    mode = mode + 1

    const basis_path = path.resolve('./basisu.exe')
    const png_path   = path.resolve('./public/t/resized/'+texture_data.n+'.png')
    const res_path   = path.resolve('./public/t/')

    writeToFile(img_png,png_path).then(()=>{
        console.log('texture resized:',texture_data.n)

        switch(texture_data.type){
            case 0:{  // ETC1S
                    let dop = ' -ktx2 -y_flip -q 255 -comp_level 2'
                    if (texture_data.mipmap){
                        dop  = dop + ' -mipmap'
                    }
                    if (texture_data.normalmap){
                        dop  = dop + ' -normal_map -linear'
                    }

                    let result = child_process.execSync(basis_path + ' "'+png_path+'" -output_path "'+res_path+'"'+dop)
                    fs.rename(path.join(res_path,texture_data.n+'.ktx2'), path.join(res_path,texture_data.n+'.k') , err=>{if (err)console.log(err)})
                }
                break;
            case 1:{  // UASTC -uastc_level (0-4)
                    let dop = ' -ktx2 -uastc -y_flip -uastc_level 3'
                    if (texture_data.mipmap){
                        dop  = dop + ' -mipmap'
                    }
                    if (texture_data.normalmap){
                        dop  = dop + ' -normal_map -linear'
                    }

                    let result = child_process.execSync(basis_path + ' "'+png_path+'" -output_path "'+res_path+'"'+dop)
                    fs.rename(path.join(res_path,texture_data.n+'.ktx2'), path.join(res_path,texture_data.n+'.k') , err=>{if (err)console.log(err)})
                }
                break;
            case 2:  // PNG
                fs.copyFileSync(png_path, path.join(res_path,texture_data.n+'.b'))
                break;
        }

        console.log('texture basis:',texture_data.n)

        textures[texture_data.n] = Object.seal({
            n         : texture_data.n,
            t         : null,
            group     : texture_data.group,
            name      : texture_data.name,
            width     : texture_data.width,
            height    : texture_data.height,
            type      : texture_data.type,
            file_name : texture_data.file_name,
            alpha     : texture_data.alpha,
            mipmap    : texture_data.mipmap,
            normalmap : texture_data.normalmap,
        })        

        USER.send_str(user,JSON.stringify({
            i : INFO.MSG_EDITOR_SAVE_TXT,
            d : textures[texture_data.n]
        }))

        fs.writeFileSync('textures.json',JSON.stringify(textures,undefined,2))
    })
   
}

export const save_texture_preview =(message)=>{
    let png_mode = 2
    if (texture_data.alpha===true){
        png_mode = 6
    }

    const p_width = 128
    const p_height = 128
    let img_png = new PNG.PNG({width: p_width, height: p_height, colorType:png_mode})  
    let b = Buffer.from(message)
    let i = 0
    for (var y = 0; y < img_png.height; y++) {
        for (var x = 0; x < img_png.width; x++) {
            var idx = (img_png.width * y + x) << 2;
            img_png.data[idx + 0] = b[i+0]
            img_png.data[idx + 1] = b[i+1]
            img_png.data[idx + 2] = b[i+2]
            img_png.data[idx + 3] = b[i+3]
            i=i+4
        }
    }

    mode = mode + 1

    writeToFile(img_png,path.resolve('./public/t/preview/'+texture_data.n+'.png')).then(()=>{
        console.log('texture preview:',texture_data.n)
    })
}
// ------------------------------------
//  Работа с моделями
// ------------------------------------
export const convert_fbx = (user,message)=>{
    if (user===null){
        mode = 4
        return
    }
    const b = Buffer.from(message)
    //
    fs.writeFileSync( path.resolve('./public/m/_0.fbx'),b)
    //
    child_process.exec('FBX2glTF-windows-x64.exe --verbose --binary --no-flip-v --input "'+path.resolve('./public/m/_0.fbx')+'" --output "'+path.resolve('./public/m/_0.glb')+'"', 
        (error, stdout, stderr)=>{
            console.log(stdout)
            //
            let b = fs.readFileSync( path.resolve('./public/m/_0.glb'))
            //
            USER.send_str(user,JSON.stringify({
                i : INFO.MSG_EDITOR_FBX_CONV,
                b : b.toString('base64'),
            }))    
    })
}

export const del_model = (user,name)=>{
    let a = models[name]
    if (a===undefined){
        return
    }

    delete models[name]

    fs.unlinkSync('public/m/'+name+'.glb')
    fs.unlinkSync('public/m/original/'+name+'.fbx')

    USER.send_str(user,JSON.stringify({
        i   : INFO.MSG_EDITOR_MODEL,
        del : name
    }))

    fs.writeFileSync('models.json',JSON.stringify(models,undefined,2))
}

export const set_glb = (user,data)=>{
    if (user===null){
        model_data = data
        if (model_data.group===''){
            model_data.group = 'root'
        }

        models[model_data.n] = model_data
        fs.writeFileSync('models.json',JSON.stringify(models,undefined,2))

        mode = 5
        return
    }

    if (mode===5){
        let png_mode = 2
   
        const p_width = 128
        const p_height = 128
        let img_png = new PNG.PNG({width: p_width, height: p_height, colorType:png_mode})  
        let b = Buffer.from(data)
        let i = 0
        for (var y = 0; y < img_png.height; y++) {
            for (var x = 0; x < img_png.width; x++) {
                var idx = (img_png.width * y + x) << 2;
                img_png.data[idx + 0] = b[i+0]
                img_png.data[idx + 1] = b[i+1]
                img_png.data[idx + 2] = b[i+2]
                img_png.data[idx + 3] = b[i+3]
                i=i+4
            }
        }
    
        mode = mode + 1
    
        writeToFile(img_png,path.resolve('./public/m/preview/'+model_data.n+'.png')).then(()=>{
            console.log('model preview:',model_data.n)
        })    

        return
    }

    if (mode===6){
        fs.writeFileSync(path.resolve('./public/m/'+model_data.n+'.g'), Buffer.from(data) )
    
        USER.send_str(user,JSON.stringify({
            i : INFO.MSG_EDITOR_MODEL,
            d : models[model_data.n]
        }))

    }
}

export const save_gltf = (gltf)=>{
    //let result = child_process.execSync('WindowsMRAssetConverter.exe "public/m/'+name+'.gltf" -min-version latest -compress-meshes -o "public/m/'+name+'.glb"')
    //console.log(result.toString())
    //fs.unlinkSync('public/m/'+name+'.gltf')
}

export function model_del(user,name){
}

// ------------------------------------
// Работа с Настройками игр
// ------------------------------------
export const get_game = (user,game_id)=>{

    const game = games[game_id]

    const hexgrid = JSON.parse(fs.readFileSync('games/'+game_id+'_hexgrid.json')) 

    USER.send_str(user,JSON.stringify({
        i : INFO.MSG_EDITOR_GET_GAME,
        g : game,
        h : hexgrid,
    }))

 }

 export const save_library = (game_id,data)=>{
    const game = games[game_id]
    game.lib = data
    fs.writeFileSync('games/'+game_id+'.json',JSON.stringify(game,undefined,2))
 }

 export const set_material = (model_name,m)=>{
    if (model_name.length===0){
        return
    }
    let model = models[model_name]
    if (!model){
        if (model_name[0]==='@'){
            models[model_name] = Object.seal({
                group     : 'generator',
                name      : model_name,
                materials : m
            })
        }
    }else{
        model.materials = m
    }
    //
    fs.writeFileSync('models.json',JSON.stringify(models,undefined,2))
}

export const save_paint_list = (game_id,data)=>{
    const game = games[game_id]
    game.global.land.tiles = data
    fs.writeFileSync('games/'+game_id+'.json',JSON.stringify(game,undefined,2))
}

export const save_land_param = (game_id,data)=>{
    const game = games[game_id]
    game.global.land = data
    fs.writeFileSync('games/'+game_id+'.json',JSON.stringify(game,undefined,2))
}

export const save_hex_param = (game_id,data)=>{
    const game = games[game_id]
    game.global.hexgrid = data
    fs.writeFileSync('games/'+game_id+'.json',JSON.stringify(game,undefined,2))
}

export const save_hex_grid = (id,data)=>{
    fs.writeFileSync('games/'+id+'_hexgrid.json',JSON.stringify(data,undefined,2))
    console.log('hexgrid saved')
}

// сохраняем текстуру  
export const set_pic = (_n,_width,_height,_mode)=>{
    n      = _n
    width  = _width
    height = _height
    mode   = _mode
}


export const set_bigmap = (_n,_width,_height)=>{
    n      = _n
    width  = _width
    height = _height
    mode   = 5
}

export const save_bigmap = (message)=>{
    let img_png = new PNG.PNG({width: width, height: height, colorType:6}) //colorType - 0 = grayscale, no alpha, 2 = color, no alpha, 4 = grayscale & alpha, 6 = color & alpha
    let b = Buffer.from(message)
    let i = 0
    const w = img_png.width
    const h = img_png.height
    for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
            var idx = (img_png.width * y + x) << 2;
            let p = ((h-y)*w+x)*4
            img_png.data[idx + 0] = b[p+0]
            img_png.data[idx + 1] = b[p+1]
            img_png.data[idx + 2] = b[p+2]
            img_png.data[idx + 3] = b[p+3]
            i=i+4
        }
    }

    img_png.pack()
        .pipe(fs.createWriteStream('./public/l/map_'+n+'.png'))
        .on('finish', function() {
            console.log('map texture saved',n)
/*
            USER.send_str(user,JSON.stringify({
                i       : INFO.MSG_EDITOR_MINIMAP,
                id      : id,
            }))
*/
        })
}

export const save_layer = (message)=>{
    let img_png = new PNG.PNG({width: width, height: height, colorType:2})  
    let b = Buffer.from(message)
    let i = 0
    for (var y = 0; y < img_png.height; y++) {
        for (var x = 0; x < img_png.width; x++) {
            var idx = (img_png.width * y + x) << 2;
            img_png.data[idx + 0] = b[i+0]
            img_png.data[idx + 1] = b[i+1]
            img_png.data[idx + 2] = b[i+2]
            img_png.data[idx + 3] = 255
            i=i+3
        }
    }

    img_png.pack()
        .pipe(fs.createWriteStream('./public/l/layer_'+n+'.png'))
        .on('finish', ()=>{
            console.log('layer texture saved',n)
        })
}

export const save_heightmap = (message)=>{
    let img_png = new PNG.PNG({width: width, height: height, colorType:2})  
    let b = Buffer.from(message)
    let i = 0
    for (var y = 0; y < img_png.height; y++) {
        for (var x = 0; x < img_png.width; x++) {
            var idx = (img_png.width * y + x) << 2;
            img_png.data[idx + 0] = b[i+0]
            img_png.data[idx + 1] = b[i+1]
            img_png.data[idx + 2] = b[i+2]
            img_png.data[idx + 3] = 255
            i=i+3
        }
    }

    img_png.pack()
        .pipe(fs.createWriteStream('./public/l/heightmap_'+n+'.png'))
        .on('finish', ()=>{
            console.log('heightmap texture saved',n)
        })
}

export const save = ()=>{
    fs.writeFileSync('textures.json',JSON.stringify(textures,undefined,2))
    fs.writeFileSync('games.json',JSON.stringify(_games,undefined,2))
    fs.writeFileSync('models.json',JSON.stringify(models,undefined,2))
    for (let i=0;i<_games.length;i++){
        const id = _games[i].id 
        fs.writeFileSync('games/'+id+'.json',JSON.stringify(games[id],undefined,2))
    }
}

export const prepare = ()=>{
    _games   = JSON.parse(fs.readFileSync('games.json')) 
    textures = JSON.parse(fs.readFileSync('textures.json'))
    models   = JSON.parse(fs.readFileSync('models.json'))
    for (let i=0;i<_games.length;i++){
        const id = _games[i].id 
        games[id] = JSON.parse(fs.readFileSync('games/'+id+'.json')) 
    }
}
