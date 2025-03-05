import { stat } from "fs";
import { open, readdir, readFile } from "fs/promises";
import http from "http";
import mime from "mime-types"

const server = http.createServer(async (req,res) =>{
      if(req.url === '/favicon.ico'){
        res.writeHead(204, { "Content-Type": "image/x-icon" });
        return res.end();
      }
      if(req.url === '/'){
        serveDirectory(req,res)
      }else{
        try{
          const [url, queryString] = req.url.split("?")
          const queryParams = {}
          queryString.split("&").forEach((pair)=>{
            const [key, value] = pair.split("=")
            queryParams[key] = value
          })
          console.log(url, queryParams)
          const filePath = `./storage${decodeURIComponent(url)}`;
            const fileHandle = await open(filePath)
            const stats = await fileHandle.stat()
            if(stats.isDirectory()){
              serveDirectory(req,res)
            }else{
              const readStream = fileHandle.createReadStream();
              res.setHeader("Content-Type",mime.contentType(url.slice(1)))
              res.setHeader("Content-Length",stats.size)
              if(queryParams.action === "download"){
                res.setHeader(
                  "Content-Disposition",
                  `attachment; filename="${url.slice(1)}"`
                )
              }
              readStream.pipe(res)
            }
            
        }catch(err){
          console.log(err.message)
          res.end("File not found")
        }
      }
})

server.listen(80,'0.0.0.0',()=>{
  console.log("srever listening on port 80")
})

async function serveDirectory(req, res) {
  const [url, queryString] = req.url.split("?")
  const itemsList = await readdir(`./storage${url}`)
  let dynamicHTML = ""
  itemsList.forEach(element => {
    dynamicHTML += `${element}<a href =".${req.url === '/' ? '' : req.url}/${element}?action=open">Open</a>
    <a href =".${req.url === '/' ? '' : req.url}/${element}?action=download">Download</a></br >`;
  });
  const htmlCode = await readFile('./boilerplate.html', 'utf-8')
  res.end(htmlCode.replace('${dynamicHTML}',dynamicHTML))
}





// const server = http.createServer(async (req, res) => {
//   if (req.url === "/favicon.ico") return res.end("No favicon.");
//   if (req.url === "/") {
//     serveDirectory(req, res);
//   } else {
//     try {
//       const fileHandle = await open(`./storage${decodeURIComponent(req.url)}`);
//       const stats = await fileHandle.stat();
//       if (stats.isDirectory()) {
//         serveDirectory(req, res);
//       } else {
//         const readStream = fileHandle.createReadStream();
//         readStream.pipe(res);
//       }
//     } catch (err) {
//       console.log(err.message);
//       res.end("Not Found!");
//     }
//   }
// });

// async function serveDirectory(req, res) {
//   const itemsList = await readdir(`./storage${req.url}`);
//   let dynamicHTML = "";
//   itemsList.forEach((item) => {
//     dynamicHTML += `<a href=".${
//       req.url === "/" ? "" : req.url
//     }/${item}">${item}</a><br>`;
//   });
//   const htmlBoilerplate = await readFile("./boilerplate.html", "utf-8");
//   res.end(htmlBoilerplate.replace("${dynamicHTML}", dynamicHTML));
// }

// server.listen(80, "0.0.0.0", () => {
//   console.log("Server started");
// });
