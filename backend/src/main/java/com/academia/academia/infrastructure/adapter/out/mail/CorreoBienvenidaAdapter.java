package com.academia.academia.infrastructure.adapter.out.mail;

import com.academia.academia.domain.port.out.NotificadorCorreoPuerto;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

@Component
public class CorreoBienvenidaAdapter implements NotificadorCorreoPuerto {

    private static final Logger log = LoggerFactory.getLogger(CorreoBienvenidaAdapter.class);

    private static final String ASUNTO = "Te damos la bienvenida a la Academia de Música Jaime Gallardo";

    /**
     * Diseño pensado para clientes de correo (Gmail, Outlook, Apple Mail):
     * tablas + estilos en línea, sin imágenes externas (así nunca sale "imagen bloqueada").
     * Colores tomados de la web: azul #1c3a73 y ámbar #f5a623. Incluye modo oscuro y adaptación a móvil.
     */
    private static final String PLANTILLA_HTML = """
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <meta name="color-scheme" content="light dark">
              <meta name="supported-color-schemes" content="light dark">
              <title>Bienvenido/a a la Academia de Música Jaime Gallardo</title>
              <style>
                @media (max-width:620px) {
                  .contenedor { width:100% !important; }
                  .pad { padding-left:22px !important; padding-right:22px !important; }
                  .titulo { font-size:24px !important; }
                }
                @media (prefers-color-scheme: dark) {
                  .fondo { background:#0e1424 !important; }
                  .tarjeta { background:#161e33 !important; border-color:#26314d !important; }
                  .titulo { color:#e8ecf6 !important; }
                  .texto { color:#c9d2e8 !important; }
                  .suave { color:#9aa6c4 !important; }
                  .cabecera { background:#161e33 !important; }
                  .pie { background:#121a2e !important; border-color:#26314d !important; }
                }
              </style>
            </head>
            <body class="fondo" style="margin:0;padding:0;background:#f4f6fa;">

              <!-- Texto de vista previa (lo que se ve junto al asunto en la bandeja) -->
              <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
                Tu cuenta ya está lista: mira los horarios y agenda tu clase de prueba.
              </div>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     class="fondo" bgcolor="#f4f6fa" style="background:#f4f6fa;">
                <tr>
                  <td align="center" style="padding:28px 12px;">

                    <table role="presentation" class="contenedor tarjeta" width="600" cellpadding="0" cellspacing="0" border="0"
                           bgcolor="#ffffff"
                           style="width:600px;max-width:600px;background:#ffffff;border:1px solid #e3e8f0;border-radius:14px;overflow:hidden;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

                      <!-- Cabecera -->
                      <tr>
                        <td class="pad cabecera" bgcolor="#ffffff" style="background:#ffffff;padding:26px 36px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td width="46" height="46" align="center" valign="middle" bgcolor="#f5a623"
                                  style="width:46px;height:46px;background:#f5a623;border-radius:23px;color:#1c3a73;font-size:26px;line-height:46px;font-weight:bold;">&#9834;</td>
                              <td style="padding-left:14px;">
                                <div class="titulo" style="color:#1c3a73;font-size:20px;font-weight:700;line-height:1.1;">Jaime Gallardo</div>
                                <div class="suave" style="color:#6b7690;font-size:11px;letter-spacing:2px;margin-top:4px;">ACADEMIA DE MÚSICA</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr><td height="4" bgcolor="#f5a623" style="height:4px;line-height:4px;font-size:4px;background:#f5a623;">&nbsp;</td></tr>

                      <!-- Saludo -->
                      <tr>
                        <td class="pad" style="padding:36px 36px 8px 36px;">
                          <div class="suave" style="color:#6b7690;font-size:14px;margin-bottom:6px;">Hola, {{nombre}}</div>
                          <div class="titulo" style="color:#1c3a73;font-size:28px;line-height:1.2;font-weight:700;">Te damos la bienvenida a tu nueva casa musical</div>
                          <p class="texto" style="color:#1f2a44;font-size:15px;line-height:1.65;margin:16px 0 0 0;">
                            Tu cuenta se creó correctamente. Ya eres parte de la Academia de Música Jaime Gallardo
                            y estos son los primeros pasos que puedes dar:
                          </p>
                        </td>
                      </tr>

                      <!-- Pasos -->
                      <tr>
                        <td class="pad" style="padding:20px 36px 4px 36px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td width="40" valign="top" style="padding-bottom:18px;">
                                <div style="width:28px;height:28px;line-height:28px;text-align:center;border-radius:14px;background:#f5a623;color:#1c3a73;font-weight:700;font-size:14px;">1</div>
                              </td>
                              <td valign="top" style="padding-bottom:18px;">
                                <div class="titulo" style="color:#1c3a73;font-size:15px;font-weight:700;">Consulta los horarios</div>
                                <div class="texto" style="color:#1f2a44;font-size:14px;line-height:1.55;margin-top:2px;">Revisa los días y las horas de cada curso y elige el que mejor se adapte a ti.</div>
                              </td>
                            </tr>
                            <tr>
                              <td width="40" valign="top" style="padding-bottom:18px;">
                                <div style="width:28px;height:28px;line-height:28px;text-align:center;border-radius:14px;background:#f5a623;color:#1c3a73;font-weight:700;font-size:14px;">2</div>
                              </td>
                              <td valign="top" style="padding-bottom:18px;">
                                <div class="titulo" style="color:#1c3a73;font-size:15px;font-weight:700;">Pide tu clase de prueba</div>
                                <div class="texto" style="color:#1f2a44;font-size:14px;line-height:1.55;margin-top:2px;">Conoce la academia y a tus docentes, sin compromiso.</div>
                              </td>
                            </tr>
                            <tr>
                              <td width="40" valign="top">
                                <div style="width:28px;height:28px;line-height:28px;text-align:center;border-radius:14px;background:#f5a623;color:#1c3a73;font-weight:700;font-size:14px;">3</div>
                              </td>
                              <td valign="top">
                                <div class="titulo" style="color:#1c3a73;font-size:15px;font-weight:700;">Inscríbete y empieza a tocar</div>
                                <div class="texto" style="color:#1f2a44;font-size:14px;line-height:1.55;margin-top:2px;">Cuando la academia confirme tu inscripción, tu cuenta pasará a ser de estudiante.</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Botón -->
                      <tr>
                        <td class="pad" align="center" style="padding:30px 36px 8px 36px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td align="center" bgcolor="#f5a623" style="background:#f5a623;border-radius:999px;">
                                <a href="{{urlWeb}}" target="_blank"
                                   style="display:inline-block;padding:14px 34px;color:#1c3a73;font-size:15px;font-weight:700;text-decoration:none;border-radius:999px;">
                                  Ver horarios y pedir mi clase de prueba
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Cierre -->
                      <tr>
                        <td class="pad" style="padding:22px 36px 34px 36px;">
                          <p class="texto" style="color:#1f2a44;font-size:15px;line-height:1.65;margin:0;">
                            Nos alegra acompañarte en tu camino musical.
                          </p>
                          <p class="titulo" style="color:#1c3a73;font-size:15px;font-weight:700;margin:14px 0 0 0;">
                            El equipo de la Academia de Música Jaime Gallardo
                          </p>
                        </td>
                      </tr>

                      <!-- Pie -->
                      <tr>
                        <td class="pad pie" bgcolor="#f8fafc" style="background:#f8fafc;border-top:1px solid #e3e8f0;padding:20px 36px;">
                          <p class="suave" style="color:#6b7690;font-size:12px;line-height:1.6;margin:0;">
                            Recibes este mensaje porque se creó una cuenta en la Academia de Música Jaime Gallardo
                            con este correo. Si no fuiste tú, puedes ignorarlo con tranquilidad.
                          </p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """;

    /** Versión en texto plano: la usan los clientes que no muestran HTML y mejora la entrega (menos spam). */
    private static final String PLANTILLA_TEXTO = """
            Hola, {{nombre}}:

            Te damos la bienvenida a la Academia de Música Jaime Gallardo.
            Tu cuenta se creó correctamente. Estos son tus primeros pasos:

              1. Consulta los horarios de los cursos.
              2. Pide tu clase de prueba, sin compromiso.
              3. Inscríbete: cuando la academia lo confirme, tu cuenta pasará a ser de estudiante.

            Empieza aquí: {{urlWeb}}

            Nos alegra acompañarte en tu camino musical.
            El equipo de la Academia de Música Jaime Gallardo

            Si no creaste esta cuenta, puedes ignorar este mensaje.
            """;

    private final ObjectProvider<JavaMailSender> mailSender;
    private final String remitente;
    private final String urlWeb;

    public CorreoBienvenidaAdapter(ObjectProvider<JavaMailSender> mailSender,
                                   @Value("${academia.correo.remitente:}") String remitente,
                                   @Value("${academia.web.url:http://localhost:5173}") String urlWeb) {
        this.mailSender = mailSender;
        this.remitente = remitente;
        this.urlWeb = urlWeb;
    }

    /** @Async: el estudiante no espera a que Gmail responda para terminar su registro. */
    @Override
    @Async
    public void enviarBienvenida(String nombre, String correo) {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null || remitente == null || remitente.isBlank()) {
            log.warn("Correo de bienvenida NO enviado a {}: falta configurar MAIL_USER y MAIL_PASSWORD.", correo);
            return;
        }

        try {
            String nombreSeguro = nombre == null || nombre.isBlank() ? "" : nombre.trim();

            String html = PLANTILLA_HTML
                    .replace("{{nombre}}", HtmlUtils.htmlEscape(nombreSeguro))
                    .replace("{{urlWeb}}", HtmlUtils.htmlEscape(urlWeb));
            String texto = PLANTILLA_TEXTO
                    .replace("{{nombre}}", nombreSeguro)
                    .replace("{{urlWeb}}", urlWeb);

            MimeMessage mensaje = sender.createMimeMessage();
            // multipart = true para enviar texto plano + HTML en el mismo correo
            MimeMessageHelper helper = new MimeMessageHelper(mensaje, true, "UTF-8");
            helper.setFrom(remitente, "Academia de Música Jaime Gallardo");
            helper.setTo(correo);
            helper.setSubject(ASUNTO);
            helper.setText(texto, html);
            sender.send(mensaje);

            log.info("Correo de bienvenida enviado a {}", correo);
        } catch (Exception e) {
            log.warn("No se pudo enviar el correo de bienvenida a {}: {}", correo, e.getMessage());
        }
    }
}