package com.academia.academia.infrastructure.adapter.in.web;

import com.academia.academia.domain.exception.RecursoNoEncontradoException;
import com.academia.academia.domain.exception.ReglaDeNegocioException;
import com.academia.academia.infrastructure.adapter.in.web.dto.ErrorDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorDto> validacion(MethodArgumentNotValidException ex) {
        Map<String, String> errores = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> errores.putIfAbsent(error.getField(), error.getDefaultMessage()));
        String mensaje = errores.values().stream().findFirst().orElse("Datos inválidos");
        return ResponseEntity.badRequest().body(new ErrorDto(mensaje, errores));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorDto> cuerpoIlegible(HttpMessageNotReadableException ex) {
        return ResponseEntity.badRequest().body(ErrorDto.de("El cuerpo de la petición no es válido"));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorDto> parametroInvalido(MethodArgumentTypeMismatchException ex) {
        return ResponseEntity.badRequest().body(ErrorDto.de("El valor del parámetro \"" + ex.getName() + "\" no es válido"));
    }

    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorDto> archivoGrande(org.springframework.web.multipart.MaxUploadSizeExceededException ex) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(ErrorDto.de("El archivo es demasiado grande (máximo 20 MB; las fotos de comprobante, 5 MB)."));
    }

    @ExceptionHandler(RecursoNoEncontradoException.class)
    public ResponseEntity<ErrorDto> noEncontrado(RecursoNoEncontradoException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ErrorDto.de(ex.getMessage()));
    }

    @ExceptionHandler(ReglaDeNegocioException.class)
    public ResponseEntity<ErrorDto> reglaDeNegocio(ReglaDeNegocioException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ErrorDto.de(ex.getMessage()));
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ErrorDto> baseDeDatos(DataAccessException ex) {
        if (ex instanceof DataIntegrityViolationException integridad) {
            return integridad(integridad);
        }
        String detalle = ex.getMostSpecificCause().getMessage();
        log.warn("Error de la base de datos: {}", detalle);
        String mensaje = detalle != null && detalle.startsWith("ERROR: ")
                ? detalle.substring(7).split("\\R")[0].replaceAll("\\s*Where:.*$", "")
                : "No se pudo completar la operación en la base de datos";
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ErrorDto.de(mensaje));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorDto> integridad(DataIntegrityViolationException ex) {
        log.warn("Error de integridad en la base de datos: {}", ex.getMostSpecificCause().getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ErrorDto.de("No se pudieron guardar los datos. Verifica que no estén repetidos e inténtalo de nuevo."));
    }
}
