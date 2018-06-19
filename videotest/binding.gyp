{
  "targets": [
    {
      "target_name": "addon",
      "sources": [ "./src/module.cc"],
      'cflags!': [ '-fno-exceptions' ],
'cflags_cc!': [ '-fno-exceptions' ],
      "include_dirs": [
            "include", "C:/libs/ffmpeg-4.0-win64-dev/include",
            "include", "C:/libs/ffmpeg",
            "include", "C:/libs/avcpp-master/src"
            
          ],
      "libraries": [

      ],
    }
  ]
  
}