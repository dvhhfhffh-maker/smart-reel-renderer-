package com.lastcorridor.coop;

import android.app.Activity;
import android.app.AlertDialog;
import android.graphics.Color;
import android.os.Bundle;
import android.content.Intent;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceError;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;

/** Android launcher for the cooperative game hosted on a HTTPS/WSS Node server. */
public final class MainActivity extends Activity {
    private WebView web;
    private final int ivory = Color.rgb(233, 225, 211);
    private final int bg = Color.rgb(8, 10, 12);
    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);
        String url = getPreferences(0).getString("server", "");
        if (url.isEmpty()) showSettings(""); else startGame(url);
    }
    private void showSettings(String message) {
        if (web != null) { web.destroy(); web = null; }
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        root.setPadding(35, 20, 35, 20);
        root.setBackgroundColor(bg);
        TextView title = new TextView(this);
        title.setText("الممر الأخير\nTHE LAST CORRIDOR");
        title.setTextSize(26); title.setTextColor(ivory); title.setGravity(Gravity.CENTER);
        root.addView(title);
        TextView hint = new TextView(this);
        hint.setText("أدخل رابط خادم اللعبة المنشور على الإنترنت.\nيمكن للاعبين الاتصال بالخادم نفسه من أي شبكة.");
        hint.setTextSize(14); hint.setTextColor(Color.rgb(182, 171, 162));
        hint.setGravity(Gravity.CENTER); hint.setPadding(0, 22, 0, 10);
        root.addView(hint);
        EditText server = new EditText(this);
        server.setSingleLine(true); server.setTextColor(ivory); server.setHintTextColor(Color.GRAY);
        server.setHint("https://your-game.example.com");
        server.setText(getPreferences(0).getString("server", ""));
        server.setInputType(android.text.InputType.TYPE_CLASS_TEXT | android.text.InputType.TYPE_TEXT_VARIATION_URI);
        root.addView(server, new LinearLayout.LayoutParams(-1, -2));
        TextView error = new TextView(this);
        error.setText(message); error.setTextColor(Color.rgb(240, 105, 88));error.setGravity(Gravity.CENTER);
        root.addView(error);
        Button play = new Button(this);play.setText("الدخول إلى المصحّة");
        root.addView(play);
        play.setOnClickListener(v -> {
            String address = server.getText().toString().trim();
            if (!(address.startsWith("https://") || address.startsWith("http://"))) {
                error.setText("الرابط يجب أن يبدأ بـ https:// أو http://");return;
            }
            getPreferences(0).edit().putString("server", address).apply();
            startGame(address);
        });
        setContentView(root);
    }
    private void startGame(String url) {
        web = new WebView(this);
        web.setBackgroundColor(bg);
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setMediaPlaybackRequiresUserGesture(true);
        web.getSettings().setAllowFileAccess(false);
        web.getSettings().setAllowContentAccess(false);
        web.getSettings().setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) showSettings("تعذّر الاتصال بالخادم. تحقق من الرابط والإنترنت.");
            }
        });
        setContentView(web);
        web.loadUrl(url);
    }
    @Override public void onBackPressed() {
        if (web != null) new AlertDialog.Builder(this).setTitle("الممر الأخير")
            .setMessage("هل تريد العودة لتغيير رابط الخادم؟")
            .setPositiveButton("نعم", (dialog, which) -> showSettings(""))
            .setNegativeButton("إلغاء", null).show();
        else super.onBackPressed();
    }
    @Override protected void onDestroy() { if(web != null) web.destroy();super.onDestroy(); }
}
