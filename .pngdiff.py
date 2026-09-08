import zlib, struct, sys
def read_png(path):
    d=open(path,'rb').read(); pos,idat,w,h,bd,ct=8,b'',0,0,0,0
    while pos<len(d):
        ln=struct.unpack_from('>I',d,pos)[0]; typ=d[pos+4:pos+8]; data=d[pos+8:pos+8+ln]; pos+=12+ln
        if typ==b'IHDR': w,h,bd,ct=struct.unpack('>IIBB',data[:10])
        elif typ==b'IDAT': idat+=data
        elif typ==b'IEND': break
    raw=zlib.decompress(idat); ch={0:1,2:3,4:2,6:4}[ct]; stride=w*ch
    out=bytearray(h*stride); prev=bytearray(stride); p=0
    for y in range(h):
        f=raw[p]; p+=1; line=bytearray(raw[p:p+stride]); p+=stride
        if f==1:
            for i in range(ch,stride): line[i]=(line[i]+line[i-ch])&255
        elif f==2:
            for i in range(stride): line[i]=(line[i]+prev[i])&255
        elif f==3:
            for i in range(stride):
                a=line[i-ch] if i>=ch else 0; line[i]=(line[i]+((a+prev[i])>>1))&255
        elif f==4:
            for i in range(stride):
                a=line[i-ch] if i>=ch else 0; b=prev[i]; c=prev[i-ch] if i>=ch else 0
                pp=a+b-c; pa=abs(pp-a); pb=abs(pp-b); pc=abs(pp-c)
                pr=a if (pa<=pb and pa<=pc) else (b if pb<=pc else c)
                line[i]=(line[i]+pr)&255
        out[y*stride:(y+1)*stride]=line; prev=line
    return w,h,ch,bytes(out)
if __name__=='__main__':
    w,h,ch,pa=read_png(sys.argv[1]); w2,h2,c2,pb=read_png(sys.argv[2])
    print('size',w,h,'vs',w2,h2)
    rows=[y for y in range(min(h,h2)) if pa[y*w*ch:(y+1)*w*ch]!=pb[y*w*ch:(y+1)*w*ch]]
    print('differing rows',len(rows))
    bands=[]
    if rows:
        st=rows[0]; prev=rows[0]
        for y in rows[1:]:
            if y>prev+4: bands.append((st,prev)); st=y
            prev=y
        bands.append((st,prev))
    print('bands',bands[:12])
    if bands:
        y0,y1=bands[0]; cols=set(); worst=(0,None)
        for y in range(y0,y1+1):
            for x in range(w):
                s=(y*w+x)*ch
                if pa[s:s+ch]!=pb[s:s+ch]:
                    cols.add(x)
                    d=max(abs(pa[s+i]-pb[s+i]) for i in range(3))
                    if d>worst[0]: worst=(d,(x,y,list(pa[s:s+3]),list(pb[s:s+3])))
        print('band0 x',min(cols),max(cols),'cols',len(cols))
        print('worst delta',worst)
