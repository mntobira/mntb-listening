package com.manatobi.listening;

import android.content.res.AssetFileDescriptor;
import android.content.res.AssetManager;
import android.net.Uri;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebViewClient;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Google Play 版（アプリ）だけで起きる「音声の劣化・音割れ」の修正（2026-10-16）。
 *
 * ■ 原因
 *   アプリ版は音源（public/ の mp3）を Capacitor の内蔵サーバー（WebViewLocalServer）から読む。
 *   &lt;audio&gt; は「○バイト目から」という Range 付きで音源を頼むが、Capacitor 8.5 の内蔵サーバーは
 *   206（部分応答）と Content-Range だけ正しく返し、★中身はファイルの先頭から★送ってしまう
 *   （WebViewLocalServer.handleLocalRequest で skip していない）。
 *   再生側は「指定した位置のデータ」だと思って先頭のデータを受け取るため、MP3 の解読が乱れて
 *   ザザッ・プツッという劣化が出る。ループの頭に戻るとき・シークのたびに起きる。
 *   Web 版（Vercel）は普通のサーバーが正しく返すので起きない ＝ ご報告の「Web 版では起きない」と一致。
 *
 * ■ 直し方
 *   アプリ内の音声・動画ファイルへの Range 付きリクエストだけをここで受け、
 *   指定された範囲のバイトを正しく返す。それ以外（HTML・JS・画像・Range なし）は今までどおり
 *   Capacitor に任せる（super に渡す）。
 */
public class RangeAwareWebViewClient extends BridgeWebViewClient {

    private static final String ASSET_DIR = "public";
    private static final Map<String, String> MEDIA_TYPES = new HashMap<>();

    static {
        MEDIA_TYPES.put("mp3", "audio/mpeg");
        MEDIA_TYPES.put("m4a", "audio/mp4");
        MEDIA_TYPES.put("aac", "audio/aac");
        MEDIA_TYPES.put("wav", "audio/wav");
        MEDIA_TYPES.put("ogg", "audio/ogg");
        MEDIA_TYPES.put("mp4", "video/mp4");
        MEDIA_TYPES.put("webm", "video/webm");
    }

    private final Bridge bridge;
    private final AssetManager assets;
    /** ファイルの長さ（バイト）。同じ音源を何度も頼まれるので覚えておく */
    private final Map<String, Long> lengths = new ConcurrentHashMap<>();

    public RangeAwareWebViewClient(Bridge bridge) {
        super(bridge);
        this.bridge = bridge;
        this.assets = bridge.getContext().getAssets();
    }

    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        try {
            WebResourceResponse media = serveMediaRange(request);
            if (media != null) return media;
        } catch (Exception ignored) {
            // 失敗したら従来の処理に任せる（音が鳴らなくなるよりは、従来の動きのほうがよい）
        }
        return super.shouldInterceptRequest(view, request);
    }

    private WebResourceResponse serveMediaRange(WebResourceRequest request) throws IOException {
        if (!"GET".equalsIgnoreCase(request.getMethod())) return null;
        Uri url = request.getUrl();
        String host = bridge.getHost();
        if (url == null || host == null || !host.equalsIgnoreCase(url.getHost())) return null;
        String path = url.getPath();
        if (path == null || path.contains("..")) return null;
        int dot = path.lastIndexOf('.');
        if (dot < 0) return null;
        String mime = MEDIA_TYPES.get(path.substring(dot + 1).toLowerCase(Locale.ROOT));
        if (mime == null) return null;

        Map<String, String> headers = request.getRequestHeaders();
        String range = headers.get("Range");
        if (range == null) range = headers.get("range");
        if (range == null) return null; // Range なしは Capacitor の通常処理で正しく返る

        String assetPath = ASSET_DIR + path;
        long total = lengthOf(assetPath);
        if (total < 0) return null; // 見つからない → 従来の処理（404 など）に任せる

        long[] span = parseRange(range, total);
        Map<String, String> out = new HashMap<>();
        out.put("Accept-Ranges", "bytes");
        out.put("Cache-Control", "no-cache");
        if (span == null) {
            out.put("Content-Range", "bytes */" + total);
            return new WebResourceResponse(mime, null, 416, "Range Not Satisfiable", out, null);
        }
        long start = span[0];
        long end = span[1];
        InputStream in = assets.open(assetPath, AssetManager.ACCESS_STREAMING);
        skipFully(in, start);
        out.put("Content-Range", "bytes " + start + "-" + end + "/" + total);
        out.put("Content-Length", String.valueOf(end - start + 1));
        return new WebResourceResponse(mime, null, 206, "Partial Content", out, new LimitedInputStream(in, end - start + 1));
    }

    /** "bytes=START-END" / "bytes=START-" / "bytes=-SUFFIX" を [start, end] にする。満たせなければ null */
    static long[] parseRange(String header, long total) {
        if (total <= 0) return null;
        String value = header.trim();
        if (!value.toLowerCase(Locale.ROOT).startsWith("bytes=")) return null;
        String spec = value.substring(6).trim();
        int comma = spec.indexOf(',');
        if (comma >= 0) spec = spec.substring(0, comma).trim(); // 複数範囲は最初の1つだけ返す
        int dash = spec.indexOf('-');
        if (dash < 0) return null;
        String a = spec.substring(0, dash).trim();
        String b = spec.substring(dash + 1).trim();
        try {
            long start;
            long end;
            if (a.isEmpty()) {
                if (b.isEmpty()) return null;
                long suffix = Long.parseLong(b);
                if (suffix <= 0) return null;
                start = Math.max(0, total - suffix);
                end = total - 1;
            } else {
                start = Long.parseLong(a);
                end = b.isEmpty() ? total - 1 : Math.min(Long.parseLong(b), total - 1);
            }
            if (start < 0 || start >= total || end < start) return null;
            return new long[] { start, end };
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private long lengthOf(String assetPath) {
        Long cached = lengths.get(assetPath);
        if (cached != null) return cached;
        long len = -1;
        // mp3 / mp4 は APK 内で無圧縮なので openFd で長さがすぐ分かる
        try (AssetFileDescriptor fd = assets.openFd(assetPath)) {
            len = fd.getLength();
        } catch (IOException compressedOrMissing) {
            // 圧縮されている場合は読み切って数える（初回だけ）
            try (InputStream in = assets.open(assetPath, AssetManager.ACCESS_STREAMING)) {
                byte[] buf = new byte[64 * 1024];
                long n = 0;
                int r;
                while ((r = in.read(buf)) != -1) n += r;
                len = n;
            } catch (IOException missing) {
                return -1;
            }
        }
        lengths.put(assetPath, len);
        return len;
    }

    private static void skipFully(InputStream in, long n) throws IOException {
        long left = n;
        byte[] buf = null;
        while (left > 0) {
            long s = in.skip(left);
            if (s > 0) {
                left -= s;
                continue;
            }
            // skip が進まないストリームでは読み捨てる
            if (buf == null) buf = new byte[16 * 1024];
            int r = in.read(buf, 0, (int) Math.min(buf.length, left));
            if (r < 0) throw new IOException("unexpected end of asset");
            left -= r;
        }
    }

    /** 指定バイト数だけ読める InputStream（範囲の外を送らない） */
    static final class LimitedInputStream extends FilterInputStream {

        private long remaining;

        LimitedInputStream(InputStream in, long limit) {
            super(in);
            this.remaining = limit;
        }

        @Override
        public int read() throws IOException {
            if (remaining <= 0) return -1;
            int b = super.read();
            if (b >= 0) remaining--;
            return b;
        }

        @Override
        public int read(byte[] b, int off, int len) throws IOException {
            if (remaining <= 0) return -1;
            int r = super.read(b, off, (int) Math.min(len, remaining));
            if (r > 0) remaining -= r;
            return r;
        }

        @Override
        public int available() throws IOException {
            return (int) Math.min(super.available(), remaining);
        }
    }
}
