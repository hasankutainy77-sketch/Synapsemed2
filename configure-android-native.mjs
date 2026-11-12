import fs from 'fs';
import path from 'path';

const root = process.cwd();
const stringsPath = path.join(root, 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml');
const manifestPath = path.join(root, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
const mainActivityPath = path.join(root, 'android', 'app', 'src', 'main', 'java', 'com', 'synapsemed', 'app', 'MainActivity.java');

// 1. Set App Name to synapsemed in strings.xml
if (fs.existsSync(stringsPath)) {
  let xml = fs.readFileSync(stringsPath, 'utf8');
  xml = xml.replace(/<string name="app_name">.*?<\/string>/, '<string name="app_name">synapsemed</string>');
  xml = xml.replace(/<string name="title_activity_main">.*?<\/string>/, '<string name="title_activity_main">synapsemed</string>');
  fs.writeFileSync(stringsPath, xml, 'utf8');
  console.log('[Android Config] Updated app_name to synapsemed');
}

// 2. Ensure AndroidManifest.xml supports RTL and configChanges for smooth orientation rotation
if (fs.existsSync(manifestPath)) {
  let manifest = fs.readFileSync(manifestPath, 'utf8');
  if (!manifest.includes('android:supportsRtl="true"')) {
    manifest = manifest.replace('<application', '<application android:supportsRtl="true" android:usesCleartextTraffic="true"');
  }
  fs.writeFileSync(manifestPath, manifest, 'utf8');
  console.log('[Android Config] Enabled RTL support in AndroidManifest.xml');
}

// 3. Configure MainActivity with Back Button handler + Native Screen Orientation Bridge (Landscape/Portrait)
if (fs.existsSync(mainActivityPath)) {
  const customMainActivity = `package com.synapsemed.app;

import android.content.pm.ActivityInfo;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().addJavascriptInterface(new Object() {
                @JavascriptInterface
                public void setOrientation(final String mode) {
                    runOnUiThread(() -> {
                        if ("landscape".equalsIgnoreCase(mode)) {
                            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
                        } else if ("portrait".equalsIgnoreCase(mode)) {
                            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
                        } else {
                            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
                        }
                    });
                }
            }, "SynapseNative");
        }

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    WebView webView = getBridge().getWebView();
                    webView.evaluateJavascript(
                        "(function(){ return window.__medsimCloseActiveSimulator ? window.__medsimCloseActiveSimulator() : false; })()",
                        value -> {
                            if (!"true".equals(value)) {
                                if (webView.canGoBack()) {
                                    webView.goBack();
                                } else {
                                    setEnabled(false);
                                    getOnBackPressedDispatcher().onBackPressed();
                                }
                            }
                        }
                    );
                } else {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                }
            }
        });
    }
}
`;
  fs.writeFileSync(mainActivityPath, customMainActivity, 'utf8');
  console.log('[Android Config] Configured hardware back button & orientation bridge in MainActivity.java');
}
`;
