/* Shared Inter metrics keep typed text aligned in the viewer and exported PDF. */
self.SigningTextLayout = (field,page,measure) => {
 const width=field.width*page.width,height=field.height*page.height;
 const natural=measure(field.text||'');
 const size=Math.max(.01,Math.min(field.font_size||12,height/1.25,natural>0?width/natural:Infinity));
 return {size,baseline:height/2+(0.96875-0.2412109375)*size/2};
};
