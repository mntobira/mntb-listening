package com.manatobi.listening;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // アプリ内の音源の Range 応答を正しくする（Google Play 版だけの音声劣化の修正。RangeAwareWebViewClient を参照）
        if (bridge != null) {
            bridge.setWebViewClient(new RangeAwareWebViewClient(bridge));
        }
    }
}
