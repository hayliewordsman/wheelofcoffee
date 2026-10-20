package com.wheelofcoffee.game;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * Full-screen WebView wrapper around the bundled game in assets/www.
 * Kept to APIs available on Android 4.2 (API 17).
 */
public class MainActivity extends Activity {

    private static final String START_URL = "file:///android_asset/www/index.html";

    private WebView web;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN
                | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(26, 13, 6));
        web.setVerticalScrollBarEnabled(false);
        web.setHorizontalScrollBarEnabled(false);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        // Needed before Android 4.4 so localStorage (the saved game) survives restarts.
        s.setDatabasePath(getDir("webstorage", MODE_PRIVATE).getPath());
        s.setAllowFileAccess(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(false);
        s.setTextZoom(100);
        s.setRenderPriority(WebSettings.RenderPriority.HIGH);

        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                // Stay inside the bundled game; never navigate elsewhere.
                return !url.startsWith("file:///android_asset/");
            }
        });

        setContentView(web);
        web.loadUrl(START_URL);
        dimSystemBars();
    }

    private void dimSystemBars() {
        web.setSystemUiVisibility(View.SYSTEM_UI_FLAG_LOW_PROFILE);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) dimSystemBars();
    }

    @Override
    protected void onPause() {
        super.onPause();
        web.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
        dimSystemBars();
    }

    @Override
    public void onBackPressed() {
        new AlertDialog.Builder(this)
                .setTitle("Leave Wheel of Coffee?")
                .setMessage("Your game is saved. Choose \"Resume saved game\" next time to pick up where you left off.")
                .setNegativeButton("Keep playing", null)
                .setPositiveButton("Exit", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        finish();
                    }
                })
                .show();
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }
}
