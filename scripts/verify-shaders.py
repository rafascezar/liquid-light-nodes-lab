import ctypes as C, json, sys
E=C.CDLL('libEGL.so.1');P=C.c_void_p;I=C.c_int;U=C.c_uint
E.eglGetProcAddress.argtypes=[C.c_char_p];E.eglGetProcAddress.restype=P
def api(name,ret,args):
 p=E.eglGetProcAddress(name.encode())
 if not p:raise RuntimeError(name+' unavailable')
 return C.CFUNCTYPE(ret,*args)(p)
getDisplay=api('eglGetPlatformDisplayEXT',P,[U,P,P]);display=getDisplay(0x31DD,None,None)
E.eglInitialize.argtypes=[P,C.POINTER(I),C.POINTER(I)];E.eglInitialize.restype=U
major=I();minor=I()
if not E.eglInitialize(display,C.byref(major),C.byref(minor)):raise RuntimeError('EGL unavailable')
E.eglBindAPI.argtypes=[U];E.eglBindAPI(0x30A0)
attrs=(I*13)(0x3033,1,0x3040,0x40,0x3024,8,0x3023,8,0x3022,8,0x3021,8,0x3038)
E.eglChooseConfig.argtypes=[P,P,C.POINTER(P),I,C.POINTER(I)];config=P();count=I();E.eglChooseConfig(display,attrs,C.byref(config),1,C.byref(count))
if not count.value:raise RuntimeError('ES3 config unavailable')
E.eglCreatePbufferSurface.argtypes=[P,P,P];E.eglCreatePbufferSurface.restype=P
surface=E.eglCreatePbufferSurface(display,config,(I*5)(0x3057,1,0x3056,1,0x3038))
E.eglCreateContext.argtypes=[P,P,P,P];E.eglCreateContext.restype=P
context=E.eglCreateContext(display,config,None,(I*3)(0x3098,3,0x3038))
E.eglMakeCurrent.argtypes=[P,P,P,P]
if not E.eglMakeCurrent(display,surface,surface,context):raise RuntimeError('ES3 context unavailable')
create=api('glCreateShader',U,[U]);source=api('glShaderSource',None,[U,I,C.POINTER(C.c_char_p),P]);compileShader=api('glCompileShader',None,[U]);get=api('glGetShaderiv',None,[U,U,C.POINTER(I)]);log=api('glGetShaderInfoLog',None,[U,I,P,P]);delete=api('glDeleteShader',None,[U])
make=api('glCreateProgram',U,[]);attach=api('glAttachShader',None,[U,U]);link=api('glLinkProgram',None,[U]);getProgram=api('glGetProgramiv',None,[U,U,C.POINTER(I)]);programLog=api('glGetProgramInfoLog',None,[U,I,P,P]);deleteProgram=api('glDeleteProgram',None,[U])
def shader(kind,text,name):
 s=create(kind);raw=C.c_char_p(text.encode());source(s,1,C.byref(raw),None);compileShader(s);ok=I();get(s,0x8B81,C.byref(ok))
 if not ok.value:
  info=C.create_string_buffer(16384);log(s,16384,None,info);raise RuntimeError(name+': '+info.value.decode())
 return s
bundle=json.load(sys.stdin);vertex=shader(0x8B31,bundle['vertex'],'vertex');failed=[]
for name,text in bundle['fragments'].items():
 try:
  fragment=shader(0x8B30,text,name);program=make();attach(program,vertex);attach(program,fragment);link(program);ok=I();getProgram(program,0x8B82,C.byref(ok))
  if not ok.value:
   info=C.create_string_buffer(16384);programLog(program,16384,None,info);raise RuntimeError(name+': '+info.value.decode())
  delete(fragment);deleteProgram(program)
 except Exception as error:failed.append(str(error))
if failed:print('\n'.join(failed));sys.exit(1)
print('Compiled and linked all '+str(len(bundle['fragments']))+' GLSL ES 3 shaders.')
