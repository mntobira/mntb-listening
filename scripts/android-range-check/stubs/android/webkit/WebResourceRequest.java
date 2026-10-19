package android.webkit; public interface WebResourceRequest { android.net.Uri getUrl(); String getMethod(); java.util.Map<String,String> getRequestHeaders(); }
