import com.manatobi.listening.*; import android.webkit.*; import android.net.Uri; import java.util.*; import java.io.*;
public class Check { public static void main(String[] a) throws Exception {
  RangeAwareWebViewClient c = new RangeAwareWebViewClient(new com.getcapacitor.Bridge());
  String f = "/bgm/battle/battle.mp3"; byte[] all = java.nio.file.Files.readAllBytes(java.nio.file.Path.of(System.getProperty("root", "../../")+"/public"+f));
  for (String r : new String[]{"bytes=0-","bytes=100000-","bytes=500000-500999","bytes=-1000","bytes=99999999-"}) {
    WebResourceResponse res = c.shouldInterceptRequest(null, req(f, r));
    if (res == null) { System.out.println(r+" -> null"); continue; }
    byte[] got = res.data==null? new byte[0] : res.data.readAllBytes();
    String cr = res.h.get("Content-Range"); System.out.print(r+" -> "+res.code+" "+cr+" len="+got.length);
    if (res.code==206) { String[] p = cr.split("[ -/]"); int s=Integer.parseInt(p[1]); System.out.print(" match="+Arrays.equals(got, Arrays.copyOfRange(all,s,s+got.length))+" lenOK="+(got.length==Integer.parseInt(res.h.get("Content-Length")))); }
    System.out.println();
  }
  System.out.println("no-range -> "+c.shouldInterceptRequest(null, req(f,null)));
  System.out.println("js -> "+c.shouldInterceptRequest(null, req("/assets/a.js","bytes=0-")));
}
static WebResourceRequest req(String p, String r){ return new WebResourceRequest(){ public Uri getUrl(){return new Uri("localhost",p);} public String getMethod(){return "GET";} public Map<String,String> getRequestHeaders(){ Map<String,String> m=new HashMap<>(); if(r!=null) m.put("Range",r); return m;} }; } }
