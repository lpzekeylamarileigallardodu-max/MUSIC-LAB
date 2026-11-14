package com.academia;

import java.util.Locale;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AcademiaApplication {

	public static void main(String[] args) {
		usarCertificadosDeWindows();
		SpringApplication.run(AcademiaApplication.class, args);
	}
	private static void usarCertificadosDeWindows() {
		boolean esWindows = System.getProperty("os.name", "").toLowerCase(Locale.ROOT).contains("win");
		boolean yaConfigurado = System.getProperty("javax.net.ssl.trustStoreType") != null;
		if (esWindows && !yaConfigurado) {
			System.setProperty("javax.net.ssl.trustStore", "NONE");
			System.setProperty("javax.net.ssl.trustStoreType", "Windows-ROOT");
		}
	}

}