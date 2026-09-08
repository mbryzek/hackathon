import sys, struct
from importlib.machinery import SourceFileLoader
m = SourceFileLoader('pd', '.pngdiff.py').load_module()
w,h,ch,px = m.read_png(sys.argv[1])
x0,y0,x1,y1 = [int(v) for v in sys.argv[3:7]]
cw, chh = x1-x0, y1-y0
stride = ((cw*3)+3)//4*4
rows=[]
for y in range(y1-1, y0-1, -1):
    row=bytearray()
    for x in range(x0,x1):
        s=(y*w+x)*ch
        row += bytes([px[s+2],px[s+1],px[s]])
    row += b'\x00'*(stride-len(row)); rows.append(bytes(row))
body=b''.join(rows)
hdr=b'BM'+struct.pack('<IHHI',54+len(body),0,0,54)+struct.pack('<IiiHHIIiiII',40,cw,chh,1,24,0,len(body),2835,2835,0,0)
open(sys.argv[2],'wb').write(hdr+body)
